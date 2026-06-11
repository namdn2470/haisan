# ================================================================
# SeaFool — Web Frontend (Next.js 15)
# Build context: monorepo root
# Usage: docker build -f apps/web/Dockerfile -t hsbx-web .
# ================================================================

# ---------------------------------------------------------------
# Stage 1: builder — build Next.js standalone output
# ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# tsconfig root + tooling cần thiết vì apps/web/tsconfig.json extends ../../tsconfig.json
COPY tsconfig.json ./
COPY tooling ./tooling
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation

# NEXT_PUBLIC_API_URL được baked vào client-side JS tại build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# API_INTERNAL_URL dùng trong next.config.js rewrites (server-side proxy)
# Docker: http://api:3001 | Local dev: không set (fallback localhost:3001)
ARG API_INTERNAL_URL=http://api:3001
ENV API_INTERNAL_URL=${API_INTERNAL_URL}

RUN pnpm --filter @hsbx/web run build

# ---------------------------------------------------------------
# Stage 2: production — standalone image cực gọn
# ---------------------------------------------------------------
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# next.config.js dùng outputFileTracingRoot = monorepo root
# → standalone output đặt server tại apps/web/server.js
COPY --from=builder --chown=appuser:appgroup /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=appuser:appgroup /workspace/apps/web/public ./apps/web/public

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', \
    (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/web/server.js"]
