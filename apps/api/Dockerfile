FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile --filter api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Fresh npm install into a single flat node_modules — avoids pnpm's
# workspace hoisting where @nestjs/core and others live in the root
# /app/node_modules rather than apps/api/node_modules.
COPY apps/api/package.json ./package.json
COPY apps/api/prisma ./prisma
RUN npm install --omit=dev && \
    npm install prisma && \
    npx prisma generate
COPY --from=builder /app/apps/api/dist ./dist
COPY apps/api/start.js ./start.js
EXPOSE 4000
CMD ["node", "start.js"]
