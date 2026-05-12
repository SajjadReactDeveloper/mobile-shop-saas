'use strict';
/**
 * Production startup script.
 *
 * Problem: the DB was originally bootstrapped with `prisma db push`, which
 * creates all the tables but does NOT write a record to _prisma_migrations.
 * When `prisma migrate deploy` runs it finds the init migration untracked,
 * tries to CREATE TABLE … and the tables already exist → exit 1.
 *
 * Fix: before running migrate deploy, check whether the tables exist but
 * the migration is untracked. If so, compute the real SHA-256 checksum of
 * the migration SQL and insert a "finished" record — exactly what Prisma
 * would have written had it run the migration itself. Migrate deploy then
 * sees the migration as already applied and skips it cleanly.
 */

const { spawnSync } = require('child_process');
const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');

async function ensureBaselined() {
  // Use the direct (non-pooled) URL for DDL + _prisma_migrations writes.
  // PrismaClient runtime reads DATABASE_URL; temporarily point it at the
  // direct connection so CREATE TABLE and INSERT work through any pooler.
  const originalDbUrl = process.env.DATABASE_URL;
  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  // Require AFTER env override so PrismaClient picks up the direct URL.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // 1. Create the migrations tracking table if it doesn't exist yet.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
        checksum            VARCHAR(64)  NOT NULL,
        finished_at         TIMESTAMPTZ,
        migration_name      VARCHAR(255) NOT NULL,
        logs                TEXT,
        rolled_back_at      TIMESTAMPTZ,
        started_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        applied_steps_count INTEGER      NOT NULL DEFAULT 0
      )
    `);

    // 2. Is the init migration already tracked?
    const tracked = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::integer AS count FROM "_prisma_migrations"
       WHERE migration_name = '20260510181513_init'`
    );
    if (tracked[0].count > 0) {
      console.log('[startup] init migration already tracked — skipping baseline.');
      return;
    }

    // 3. Do the app tables already exist? (created via db push)
    const tables = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::integer AS count
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'Shop'`
    );
    if (tables[0].count === 0) {
      console.log('[startup] no existing tables — migrate deploy will create them.');
      return;
    }

    // 4. Compute the real checksum Prisma expects (SHA-256 of the SQL file).
    const migFile = join(
      __dirname,
      'prisma', 'migrations', '20260510181513_init', 'migration.sql'
    );
    const checksum = createHash('sha256')
      .update(readFileSync(migFile, 'utf8'))
      .digest('hex');

    // 5. Insert the baseline record — marks the migration as applied without
    //    re-running any of the SQL (tables already exist).
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, finished_at, migration_name, applied_steps_count)
       VALUES (gen_random_uuid()::text, $1, NOW(), '20260510181513_init', 1)`,
      checksum
    );
    console.log(
      '[startup] ✅ init migration baselined — checksum',
      checksum.slice(0, 12) + '…'
    );
  } catch (err) {
    // Non-fatal: let migrate deploy surface any real problem.
    console.error('[startup] baseline warning (non-fatal):', err.message);
  } finally {
    await prisma.$disconnect();
    // Restore original DATABASE_URL so the NestJS app uses the pooled URL.
    process.env.DATABASE_URL = originalDbUrl;
  }
}

async function main() {
  await ensureBaselined();

  // migrate deploy reads directUrl from schema.prisma automatically for DDL;
  // DATABASE_URL is now back to the pooled URL for runtime queries.
  console.log('[startup] running prisma migrate deploy…');
  const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (migrate.status !== 0) {
    console.error('[startup] prisma migrate deploy failed — status', migrate.status);
    process.exit(migrate.status ?? 1);
  }

  console.log('[startup] starting NestJS application…');
  require('./dist/main');
}

main().catch((err) => {
  console.error('[startup] fatal:', err);
  process.exit(1);
});
