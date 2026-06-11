#!/bin/sh
set -e

echo "==> [SeaFool API] Khởi động container..."

echo "==> Đồng bộ database schema..."
cd /app/packages/db
npx prisma migrate deploy --schema=prisma/schema.prisma \
  || echo "==> Cảnh báo: migration bỏ qua hoặc đã cập nhật."

echo "==> Khởi động NestJS API server..."
cd /app
exec node ./apps/api/dist/main.js
