# ================================================================
# SeaFool — Backend API (NestJS)
# Build context: monorepo root
# Usage: docker build -f apps/api/Dockerfile -t hsbx-api .
# ================================================================

# ---------------------------------------------------------------
# Stage 1: builder — biên dịch NestJS + generate Prisma client
# ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy manifests trước để tận dụng Docker layer cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# tsconfig root + tooling cần thiết vì apps/api/tsconfig.json extends ../../tsconfig.json
COPY tsconfig.json ./
COPY tooling ./tooling
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/

# Cài toàn bộ deps (bao gồm devDeps để build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Generate Prisma client
# prisma.config.ts dùng dotenv không có trong deps của @hsbx/db → xóa trước khi generate
RUN rm -f packages/db/prisma.config.ts && \
    cd packages/db && npx prisma generate --schema=prisma/schema.prisma

# Biên dịch TypeScript → dist/
RUN pnpm --filter @hsbx/api run build

# ---------------------------------------------------------------
# Stage 2: production — image runtime gọn nhẹ
# ---------------------------------------------------------------
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# openssl cần thiết cho Prisma
RUN apk add --no-cache openssl postgresql-client bash

# Tạo user không có quyền root để chạy app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config để pnpm có thể install + tạo symlink
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/

# shamefully-hoist: cho phép NestJS access express, multer, etc. (transitive deps không được pnpm hoist mặc định)
RUN echo "shamefully-hoist=true" > .npmrc

# Copy TypeScript source của workspace packages
# Node.js 22 load file .ts natively (typescript stripping)
# apps/api/node_modules/@hsbx/* → symlink → packages/*/
COPY --from=builder /workspace/packages/db/src ./packages/db/src
COPY --from=builder /workspace/packages/db/prisma ./packages/db/prisma
COPY --from=builder /workspace/packages/shared/src ./packages/shared/src
COPY --from=builder /workspace/packages/validation/src ./packages/validation/src

# Chỉ install production deps (không có devDeps)
RUN pnpm install --frozen-lockfile --prod

# Generate lại Prisma client trong môi trường production
RUN cd packages/db && npx prisma generate --schema=prisma/schema.prisma

# Copy compiled API từ builder
COPY --from=builder /workspace/apps/api/dist ./apps/api/dist

# Copy seed.ts và prisma source (cho tsx)
COPY --from=builder /workspace/packages/db/prisma ./packages/db/prisma

# Install tsx globally để chạy seed TypeScript
RUN npm install -g tsx

# Thư mục uploads — sẽ được mount bởi Docker volume
RUN mkdir -p ./apps/api/public/uploads

# Copy và fix line endings (Windows CRLF → Unix LF) + cấp quyền
COPY apps/api/docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', \
    (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
