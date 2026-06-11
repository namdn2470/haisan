# Hướng Dẫn Deploy SeaFool

## Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Hệ Thống](#cấu-trúc-hệ-thống)
3. [Yêu Cầu](#yêu-cầu)
4. [Các Phương Án Deploy](#các-phương-án-deploy)
   - [Phương án 1: Deploy từ Mac (khuyến nghị)](#phương-án-1-deploy-từ-mac-khuyến-nghị)
   - [Phương án 2: Deploy trực tiếp trên server](#phương-án-2-deploy-trực-tiếp-trên-server)
5. [Cấu Hình .env](#cấu-hình-env)
6. [Khắc Phục Sự Cố](#khắc-phục-sự-cố)

---

## Tổng Quan

SeaFool (Hải Sản Biển Xanh) là nền tảng thương mại điện tử hải sản tươi sống, được triển khai dưới dạng container Docker trên server **Ubuntu/Linux amd64**.

```
                    ┌─────────────────┐
   Người dùng  ────▶│  Nginx / Caddy  │─────── Port 80/443
                    │   (reverse proxy, SSL)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │  Next.js   │ │   NestJS   │ │  Postgres  │
        │  (Web)     │ │   (API)    │ │  (DB)     │
        │  :3000     │ │  :3001     │ │  :5432    │
        └────────────┘ └────────────┘ └────────────┘
```

---

## Cấu Trúc Hệ Thống

```
SeaFool/
├── apps/
│   ├── api/                  # NestJS Backend
│   │   ├── Dockerfile        # Multi-stage build
│   │   └── docker-entrypoint.sh
│   └── web/                  # Next.js Frontend
│       └── Dockerfile
├── packages/
│   └── db/                   # Prisma schema
├── docker-compose.prod.yml   # Compose file cho production
├── server-deploy.sh          # Script deploy trực tiếp trên server
└── fast-deploy.ps1           # Script deploy từ Mac qua SCP
```

---

## Yêu Cầu

### Trên Mac (build + deploy)

- macOS (Apple Silicon hoặc Intel)
- Docker Desktop ≥ 4.x (đã bật Docker Buildx + QEMU)
- PowerShell 7 (`brew install powershell`)
- SSH key đã cấu hình lên server (để SCP/SHH không cần nhập password)
- SSH agent đang chạy: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_rsa`

### Trên Server

- Ubuntu 20.04+ / Debian 12+
- Docker Engine ≥ 24.x + docker-compose v2
- Kiến trúc: **linux/amd64**
- Ports mở: `3002` (API), `8082` (Web)
- Firewall cho phép kết nối vào ports trên

---

## Các Phương Án Deploy

### Phương án 1: Deploy từ Mac (khuyến nghị)

Dùng khi code đã thay đổi và cần build lại image mới.

**Ưu điểm:** Không cần Docker trên server, build nhanh trên Mac, kiểm soát hoàn toàn.

#### Bước 1: Tạo file `.env.server`

```bash
cp .env.docker.example .env.server
# Hoặc tạo mới với nội dung:
```

Nội dung tối thiểu:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<mật-khẩu-mạnh-của-bạn>
POSTGRES_DB=hai_san_bien_xanh

DATABASE_URL=postgresql://postgres:<mật-khẩu>@postgres:5432/hai_san_bien_xanh
DIRECT_URL=postgresql://postgres:<mật-khẩu>@postgres:5432/hai_san_bien_xanh

JWT_SECRET=<chuỗi-secret-ngẫu-nhiên-dài>
JWT_EXPIRES_IN=7d

API_PORT=3001
CORS_ORIGINS=http://14.225.217.232:8082,http://14.225.217.232

API_IMAGE=namdn2470/seafool-api
WEB_IMAGE=namdn2470/seafool-web
IMAGE_TAG=latest
WEB_PORT=8082
```

#### Bước 2: Cấu hình SSH key (bước một lần)

```bash
# Tạo SSH key nếu chưa có
ssh-keygen -t ed25519 -C "mac-deploy"

# Copy lên server
ssh-copy-id root@14.225.217.232

# Xác nhận không cần password
ssh root@14.225.217.232 "echo OK"
```

#### Bước 3: Chạy deploy

```bash
pwsh ~/Desktop/SeaFool/fast-deploy.ps1
```

**Script sẽ tự động:**

```
[1/5] Build Docker images (linux/amd64) trên Mac
       ↓ docker buildx build --platform linux/amd64
[2/5] Export images thành .tar
       ↓ docker save -o hsbx-api.tar
[3/5] SCP files lên server (~1.4 GB)
       ↓ scp hsbx-api.tar root@14.225.217.232:~/deployment/haisan/
[4/5] SSH: load images + khởi động containers
       ↓ docker load -i hsbx-api.tar
[5/5] Dọn dẹp file tạm
```

**Thành công:**

```
=======================================================
  TRIEN KHAI HOAN TAT!
  Trang chu : http://14.225.217.232:8082
  Admin     : http://14.225.217.232:8082/admin/login
  API       : http://14.225.217.232:3002/api
=======================================================
```

**Thời gian:** ~5-15 phút (lần đầu chậm hơn vì QEMU emulation).

---

### Phương án 2: Deploy trực tiếp trên server

Dùng khi đã có image trên Docker Hub hoặc không có Mac.

#### Bước 1: SSH vào server

```bash
ssh root@14.225.217.232
```

#### Bước 2: Tải và chạy script

```bash
# Cách 1: Copy script từ Mac
scp ~/Desktop/SeaFool/server-deploy.sh root@14.225.217.232:/root/
ssh root@14.225.217.232 "bash /root/server-deploy.sh"

# Cách 2: Tạo file thủ công trên server
# Tạo docker-compose.yml và .env như trong server-deploy.sh
```

#### Bước 3: Khởi động lại (khi có image mới)

```bash
cd ~/deployment/haisan
docker compose pull
docker compose up -d --force-recreate
docker compose ps
```

---

## Cấu Hình .env

File `.env` trên server cần chứa các biến sau:

| Biến | Ví dụ | Ghi chú |
|---|---|---|
| `POSTGRES_USER` | `postgres` | User Postgres |
| `POSTGRES_PASSWORD` | `abc123xyz` | Mật khẩu Postgres |
| `POSTGRES_DB` | `hai_san_bien_xanh` | Tên database |
| `DATABASE_URL` | `postgresql://postgres:...` | Connection string |
| `DIRECT_URL` | `postgresql://postgres:...` | Connection string trực tiếp |
| `JWT_SECRET` | `<chuỗi-64-ký-tự>` | Dùng `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | `7d` | Thời hạn token |
| `CORS_ORIGINS` | `http://14.225.217.232:8082` | Domain production |
| `API_IMAGE` | `namdn2470/seafool-api` | Image API |
| `WEB_IMAGE` | `namdn2470/seafool-web` | Image Web |
| `IMAGE_TAG` | `latest` | Tag image |
| `WEB_PORT` | `8082` | Port web expose ra ngoài |

---

## Khắc Phục Sự Cố

### Lỗi `no matching manifest for linux/amd64`

**Nguyên nhân:** Image build trên Apple Silicon (arm64) nhưng server là amd64.

**Fix:** Đảm bảo `docker-compose.prod.yml` có `platform: linux/amd64`:

```yaml
services:
  api:
    image: namdn2470/seafool-api:latest
    platform: linux/amd64   # ← Thêm dòng này
```

Và `fast-deploy.ps1` dùng `--platform linux/amd64`:

```bash
docker buildx build -f apps/api/Dockerfile --platform linux/amd64 --load -t hsbx-api:latest .
```

---

### Lỗi `lstat apps: no such file or directory`

**Nguyên nhân:** PowerShell không tìm được `$PSScriptRoot`.

**Fix:** Đảm bảo chạy script từ thư mục chứa `fast-deploy.ps1`:

```bash
cd ~/Desktop/SeaFool
pwsh ./fast-deploy.ps1
```

---

### Lỗi `EADDRINUSE: address already in use`

**Nguyên nhân:** Port đã bị container/service khác chiếm.

**Fix:**

```bash
# Trên server
docker compose -f ~/deployment/haisan/docker-compose.prod.yml down
docker compose -f ~/deployment/haisan/docker-compose.prod.yml up -d
```

---

### Lỗi `permission denied` khi SSH/SCP

**Nguyên nhân:** Chưa cấu hình SSH key.

**Fix:**

```bash
# Trên Mac
ssh-copy-id root@14.225.217.232
# Nhập password lần cuối
```

---

### Kiểm tra logs

```bash
# Trên server
docker compose -f ~/deployment/haisan/docker-compose.prod.yml logs -f
docker compose -f ~/deployment/haisan/docker-compose.prod.yml logs api --tail=100
docker compose -f ~/deployment/haisan/docker-compose.prod.yml logs web --tail=100
```

### Kiểm tra trạng thái

```bash
docker compose -f ~/deployment/haisan/docker-compose.prod.yml ps
docker compose -f ~/deployment/haisan/docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Restart containers

```bash
docker compose -f ~/deployment/haisan/docker-compose.prod.yml restart
```

### Xóa hoàn toàn và deploy lại

```bash
docker compose -f ~/deployment/haisan/docker-compose.prod.yml down -v
# Xóa images cũ
docker rmi namdn2470/seafool-api:latest namdn2470/seafool-web:latest
# Deploy lại
pwsh ~/Desktop/SeaFool/fast-deploy.ps1
```

---

## Quy Trình Deploy Nhanh (Sau Lần Đầu)

```
1. git commit các thay đổi
2. pwsh ~/Desktop/SeaFool/fast-deploy.ps1
3. Truy cập http://14.225.217.232:8082
```
