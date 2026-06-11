#!/bin/bash
# ================================================================
# server-deploy.sh — Chạy TRỰC TIẾP trên server 14.225.217.232
# Kéo images từ Docker Hub và khởi động SeaFool
# Usage: bash server-deploy.sh
# ================================================================
set -e

DEPLOY_DIR=~/deployment/haisan
API_IMAGE="namdn2470/seafool-api:latest"
WEB_IMAGE="namdn2470/seafool-web:latest"

echo "==> Tạo thư mục deploy..."
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "==> Tạo file .env..."
cat > .env << 'EOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hai_san_bien_xanh

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hai_san_bien_xanh
DIRECT_URL=postgresql://postgres:postgres@postgres:5432/hai_san_bien_xanh
API_PORT=3001

JWT_SECRET=dev-secret-seafool-2026
JWT_EXPIRES_IN=7d

CORS_ORIGINS=http://14.225.217.232:8082,http://14.225.217.232

API_IMAGE=namdn2470/seafool-api
WEB_IMAGE=namdn2470/seafool-web
IMAGE_TAG=latest
WEB_PORT=8082
EOF

echo "==> Tạo docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
services:
  api:
    image: namdn2470/seafool-api:latest
    platform: linux/amd64
    container_name: hsbx_api_prod
    restart: always
    env_file: .env
    environment:
      NODE_ENV: production
    ports:
      - "3002:3001"
    volumes:
      - uploads_data:/app/apps/api/public/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hsbx_network

  web:
    image: namdn2470/seafool-web:latest
    platform: linux/amd64
    container_name: hsbx_web_prod
    restart: always
    ports:
      - "8082:3000"
    environment:
      API_INTERNAL_URL: http://api:3001
    depends_on:
      - api
    networks:
      - hsbx_network

  postgres:
    image: postgres:16-alpine
    container_name: hsbx_db_prod
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hai_san_bien_xanh
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hsbx_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  uploads_data:

networks:
  hsbx_network:
    driver: bridge
EOF

echo "==> Pull images từ Docker Hub (linux/amd64)..."
docker pull --platform linux/amd64 "$API_IMAGE"
docker pull --platform linux/amd64 "$WEB_IMAGE"
docker pull --platform linux/amd64 postgres:16-alpine

echo "==> Dừng containers cũ (nếu có)..."
docker compose down 2>/dev/null || true

echo "==> Khởi động containers..."
docker compose up -d

echo "==> Đợi containers ổn định (30s)..."
sleep 30

echo "==> Trạng thái:"
docker compose ps

echo ""
echo "======================================================="
echo " DEPLOY XONG!"
echo " Web  : http://14.225.217.232:8082"
echo " Admin: http://14.225.217.232:8082/admin/login"
echo " API  : http://14.225.217.232:3002/api"
echo "======================================================="
