# Mobile Shop SaaS — Claude Instructions

## Before Every Push

Run these three checks locally and fix any errors before committing:

```bash
pnpm lint                      # must exit 0, no errors
pnpm --filter api build        # must compile cleanly
pnpm --filter @repo/web build  # must generate static pages cleanly
```

Never push if any of these fail. Fix the errors first, then commit and push.

## Project Overview

Full-stack SaaS for Pakistani mobile shops. Monorepo managed with Turborepo + pnpm workspaces.

```
apps/api      — NestJS backend (deployed to Render via Docker)
apps/web      — Next.js 16 dashboard (deployed to Vercel)
apps/mobile   — Expo React Native app (Android-first)
packages/db   — Prisma schema + Neon migrations
packages/ui   — Shared component library
```

## Deployed URLs

- API: https://mobile-shop-saas.onrender.com/api/v1
- Web: https://mobile-shop-saas-web.vercel.app
- Health: https://mobile-shop-saas.onrender.com/api/v1/health

## Tech Stack

- **Backend**: NestJS, Prisma ORM, Neon PostgreSQL
- **Auth**: JWT — email/password + Google OAuth + Phone OTP
- **Frontend**: Next.js 16 (App Router), TanStack Query, Tailwind
- **Mobile**: Expo (React Native)
- **Real-time**: Socket.io WebSocket gateway
- **Storage**: Cloudinary
- **Payments**: Stripe (subscriptions)
- **Notifications**: WhatsApp Business API (Meta Graph API)
- **CI/CD**: GitHub Actions → Render (API) + Vercel (web)

## Key Rules

- Multi-tenant: every DB record has `shopId` — always filter by it in services
- `AuthenticatedUser` type lives in `apps/api/src/auth/types/auth.types.ts` — use it for all `@CurrentUser()` params, never `any`
- Controller `@Body()` params must match the exact service method signature
- `pnpm` v9 required — do not use npm or yarn in the monorepo root
- ESLint config: `apps/api/eslint.config.mjs` uses `recommendedTypeChecked` — unsafe-* rules are errors
