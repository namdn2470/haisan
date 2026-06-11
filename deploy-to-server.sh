#!/bin/bash
# ================================================================
# deploy-to-server.sh — Chạy trên MacBook để deploy lên server
# Usage: bash deploy-to-server.sh
# ================================================================

SERVER_IP="14.225.217.232"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"   # đổi nếu dùng key khác
REMOTE_SCRIPT="/tmp/server-deploy.sh"

echo "==> Kiểm tra kết nối SSH tới $SERVER_USER@$SERVER_IP..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
    "$SERVER_USER@$SERVER_IP" "echo OK" 2>/dev/null; then
  echo ""
  echo "❌ Không kết nối được SSH. Thử các cách:"
  echo "   1. Dùng mật khẩu: ssh root@$SERVER_IP"
  echo "   2. Kiểm tra key: ls ~/.ssh/"
  echo "   3. Chạy thủ công: copy nội dung server-deploy.sh vào server rồi bash server-deploy.sh"
  exit 1
fi

echo "✅ SSH OK — đang copy server-deploy.sh lên server..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "$(dirname "$0")/server-deploy.sh" \
    "$SERVER_USER@$SERVER_IP:$REMOTE_SCRIPT"

echo "==> Chạy deploy trên server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    -t "$SERVER_USER@$SERVER_IP" \
    "bash $REMOTE_SCRIPT"

echo ""
echo "======================================================="
echo " DONE! Kiểm tra tại:"
echo " Web  : http://$SERVER_IP:8082"
echo " Admin: http://$SERVER_IP:8082/admin/login"
echo " API  : http://$SERVER_IP:3002/api"
echo "======================================================="
