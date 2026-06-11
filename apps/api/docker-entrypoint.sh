#!/bin/bash
set -e

echo "==> [SeaFool API] Khởi động container..."

# Parse DATABASE_URL để lấy connection params
# Format: postgresql://user:pass@host:port/dbname
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/hai_san_bien_xanh}"
DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@||' | cut -d':' -f1 | cut -d'/' -f1)
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*@||' | cut -d':' -f2 | cut -d'/' -f1)
DB_USER=$(echo "$DB_URL" | sed -E 's|.*://||' | cut -d':' -f1)
DB_PASS=$(echo "$DB_URL" | sed -E 's|.*://[^:]+:||' | sed -E 's|@.*||')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/||' | cut -d'?' -f1)

export PGPASSWORD="$DB_PASS"

# Chờ DB sẵn sàng (tối đa 30s)
echo "==> Đợi PostgreSQL ($DB_HOST:$DB_PORT)..."
ATTEMPTS=0
until PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 15 ]; then
    echo "==> PostgreSQL không phản hồi sau 30s, tiếp tục..."
    break
  fi
  echo "   Đang đợi... ($ATTEMPTS/15)"
  sleep 2
done

echo "==> Đồng bộ database schema..."
cd /app/packages/db
npx prisma migrate deploy --schema=prisma/schema.prisma \
  || echo "==> Migration đã áp dụng hoặc bỏ qua."

# Kiểm tra DB có dữ liệu chưa
CATEGORY_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null | tr -d '[:space:]' || echo "0")

if [ "$CATEGORY_COUNT" = "0" ] || [ -z "$CATEGORY_COUNT" ]; then
  echo "==> DB trống — chạy seed..."
  npx tsx prisma/seed.ts
else
  echo "==> DB đã có $CATEGORY_COUNT categories — bỏ qua seed."
fi

echo "==> Khởi động NestJS API server..."
cd /app
exec node ./apps/api/dist/main.js
