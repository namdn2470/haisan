#!/bin/bash
# ================================================================
# Script deploy SeaFool lên VPS
# Chạy trên VPS sau khi SSH vào: bash deploy-vps.sh
# ================================================================
set -e

echo "==> [SeaFool] Bắt đầu deploy..."

# Cài Docker nếu chưa có
if ! command -v docker &> /dev/null; then
  echo "==> Cài đặt Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# Tạo thư mục project
mkdir -p /opt/seafool
cd /opt/seafool

# Tạo file .env nếu chưa có
if [ ! -f .env ]; then
  echo "==> Tạo file .env..."
  cat > .env << 'ENVEOF'
POSTGRES_USER=seafool
POSTGRES_PASSWORD=SeaFool@Prod2024!
POSTGRES_DB=hai_san_bien_xanh
DATABASE_URL=postgresql://seafool:SeaFool@Prod2024!@postgres:5432/hai_san_bien_xanh
DIRECT_URL=postgresql://seafool:SeaFool@Prod2024!@postgres:5432/hai_san_bien_xanh
JWT_SECRET=hsbx-jwt-super-secret-production-2024
JWT_EXPIRES_IN=7d
API_IMAGE=namdn2470/seafool-api
WEB_IMAGE=namdn2470/seafool-web
IMAGE_TAG=latest
WEB_PORT=3000
ENVEOF
  echo "==> ⚠️  Hãy sửa file .env để đổi mật khẩu trước khi dùng thật!"
fi

# Tải docker-compose.prod.yml
echo "==> Tải docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'COMPOSEEOF'
version: '3.8'

services:
  api:
    image: ${API_IMAGE:-namdn2470/seafool-api}:${IMAGE_TAG:-latest}
    container_name: hsbx_api_prod
    restart: always
    env_file: .env
    environment:
      NODE_ENV: production
    volumes:
      - uploads_data:/app/apps/api/public/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hsbx_network

  web:
    image: ${WEB_IMAGE:-namdn2470/seafool-web}:${IMAGE_TAG:-latest}
    container_name: hsbx_web_prod
    restart: always
    ports:
      - "${WEB_PORT:-3000}:3000"
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
    env_file: .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hsbx_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  uploads_data:

networks:
  hsbx_network:
    driver: bridge
COMPOSEEOF

# Pull images mới nhất
echo "==> Pull images từ Docker Hub..."
docker compose -f docker-compose.prod.yml pull

# Khởi động
echo "==> Khởi động containers..."
docker compose -f docker-compose.prod.yml up -d

# Chờ API healthy
echo "==> Chờ API khởi động..."
sleep 15

# Kiểm tra
echo "==> Trạng thái containers:"
docker compose -f docker-compose.prod.yml ps

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "✅ Deploy thành công!"
echo "🌐 Website: http://${SERVER_IP}:3000"
echo "🔧 Admin:   http://${SERVER_IP}:3000/admin/login"
echo "📡 API:     http://${SERVER_IP}:3001/api"
echo ""
echo "Tài khoản admin: 0901234567 / Admin@123"
