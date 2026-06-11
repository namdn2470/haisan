#!/bin/bash
# ================================================================
# server-deploy.sh
# - Chạy trên Mac  → tự SSH vào server và deploy
# - Chạy trên Server → pull images và khởi động containers
# Usage: bash server-deploy.sh
# ================================================================

SERVER_IP="14.225.217.232"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"
DEPLOY_DIR="$HOME/deployment/haisan"

# ── Phát hiện đang chạy trên Mac hay Server ────────────────────
IS_SERVER=false
if [[ "$(hostname)" == "k8s-worker-2" ]] || [[ "$SERVER_SIDE" == "1" ]]; then
  IS_SERVER=true
fi

if [[ "$IS_SERVER" == "false" ]]; then
  # ════════════════════════════════════════
  # ĐANG CHẠY TRÊN MAC → SSH lên server
  # ════════════════════════════════════════
  echo "==> Phát hiện đang chạy trên Mac. Kết nối SSH tới $SERVER_USER@$SERVER_IP..."

  SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
  if [[ -f "$SSH_KEY" ]]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
  fi

  if ! ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
    echo ""
    echo "❌ Không kết nối được SSH!"
    echo "   Kiểm tra key: ssh-copy-id -i ~/.ssh/id_ed25519 root@$SERVER_IP"
    echo "   Hoặc thêm key thủ công vào /root/.ssh/authorized_keys trên server"
    exit 1
  fi

  echo "==> SSH OK — copy script lên server..."
  scp $SSH_OPTS "$(realpath "$0")" "$SERVER_USER@$SERVER_IP:/tmp/server-deploy.sh"

  echo "==> Chạy deploy trên server..."
  ssh $SSH_OPTS -t "$SERVER_USER@$SERVER_IP" "SERVER_SIDE=1 bash /tmp/server-deploy.sh"
  exit $?
fi

# ════════════════════════════════════════
# ĐANG CHẠY TRÊN SERVER → Deploy thật
# ════════════════════════════════════════
set -e

API_IMAGE="namdn2470/seafool-api:latest"
WEB_IMAGE="namdn2470/seafool-web:latest"

echo "==> Tạo thư mục deploy..."
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "==> Tạo file .env..."
cat > .env << 'ENVEOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hai_san_bien_xanh

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hai_san_bien_xanh
DIRECT_URL=postgresql://postgres:postgres@postgres:5432/hai_san_bien_xanh
API_PORT=3001

JWT_SECRET=dev-secret-seafool-2026
JWT_EXPIRES_IN=7d

CORS_ORIGINS=http://14.225.217.232:8082,http://14.225.217.232
ENVEOF

echo "==> Tạo docker-compose.yml..."
cat > docker-compose.yml << 'DCEOF'
services:
  api:
    image: namdn2470/seafool-api:latest
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
    container_name: hsbx_web_prod
    restart: always
    ports:
      - "8082:3000"
    depends_on:
      api:
        condition: service_healthy
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
DCEOF

echo "==> Pull images từ Docker Hub..."
docker pull "$API_IMAGE"
docker pull "$WEB_IMAGE"
docker pull postgres:16-alpine

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
