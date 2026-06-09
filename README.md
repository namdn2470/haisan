# 🦐 Hải Sản Biển Xanh

Hệ thống bán hải sản tươi sống online đa nền tảng.

## Kiến trúc

```
hai-san-bien-xanh/
├── apps/
│   ├── web/          # Next.js 15 — Website bán hàng
│   ├── mobile/       # Expo — Mobile App
│   └── api/          # NestJS 11 — Backend API
├── packages/
│   ├── db/           # Prisma schema + database client
│   ├── ui/           # Shared UI components
│   ├── shared/       # Types, constants, utils
│   └── validation/   # Zod schemas
├── tooling/
│   ├── eslint/       # ESLint config
│   ├── prettier/     # Prettier config
│   └── typescript/   # TypeScript config
└── docs/             # Tài liệu
```

## Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Frontend Web | Next.js 15 + React 19 |
| Mobile | Expo (React Native) |
| API | NestJS 11 |
| Database | PostgreSQL + Prisma |
| Validation | Zod |
| UI | CSS thuần + lucide-react |
| Monorepo | Turborepo + pnpm workspaces |

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|----------|---------------------|
| Node.js | >= 20.0.0 |
| pnpm | 9.x |
| PostgreSQL | 14+ |
| Git | bất kỳ |

### Cài đặt Node.js (chưa có)

**macOS (dùng Homebrew):**
```bash
brew install node@20
brew install pnpm
```

**Windows (dùng nvm-windows hoặc fnm):**
```powershell
# Dùng fnm
winget install Schniz.fnm
fnm use 20
corepack enable
corepack prepare pnpm@9 --activate
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

### Cài đặt PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:** Tải từ https://www.postgresql.org/download/windows/

Sau khi cài, tạo database:
```bash
# macOS/Linux
createdb hai_san_bien_xanh

# Hoặc dùng psql
psql -U postgres -c "CREATE DATABASE hai_san_bien_xanh;"
```

---

## Cài đặt dự án

### 1. Clone dự án

```bash
git clone https://github.com/namdn2470/sea.git
cd sea
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

> Nếu chưa cài pnpm: `npm install -g pnpm`

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Sau đó mở file `.env` và chỉnh sửa các giá trị:

```env
# Database — Đảm bảo đúng username/password của máy bạn
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hai_san_bien_xanh"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hai_san_bien_xanh"

# API
API_PORT=3001
API_URL=http://localhost:3001

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3012

# JWT — Thay bằng chuỗi ngẫu nhiên bảo mật
JWT_SECRET=your-secret-key-change-in-production

# Supabase (optional — bỏ trống nếu chưa dùng)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4. Chạy Database Migration

```bash
pnpm db:migrate
```

### 5. Nạp dữ liệu mẫu

```bash
pnpm db:seed
```

### 6. Chạy ứng dụng

```bash
pnpm dev
```

Truy cập:

| Service | URL |
|---------|-----|
| Website | http://localhost:3012 |
| Admin Panel | http://localhost:3012/admin |
| API | http://localhost:3001 |
| Prisma Studio | `pnpm db:studio` |

---

## Các lệnh thường dùng

| Lệnh | Mô tả |
|------|--------|
| `pnpm dev` | Chạy web + api |
| `pnpm dev:web` | Chỉ chạy web |
| `pnpm dev:api` | Chỉ chạy api |
| `pnpm build` | Build production |
| `pnpm db:migrate` | Chạy Prisma migration |
| `pnpm db:seed` | Nạp dữ liệu mẫu |
| `pnpm db:studio` | Mở Prisma Studio |
| `pnpm lint` | Kiểm tra lint |
| `pnpm format` | Format code |
| `pnpm clean` | Xóa node_modules + build cache |

---

## Các module API

- Auth (register/login JWT)
- Products (CRUD + variants + sizes)
- Categories (tree structure)
- Cart (session/user based)
- Orders (checkout → pay → deliver)
- Payments (COD, MoMo, ZaloPay, bank transfer)
- Promotions (percent, fixed, free shipping)
- Reviews (rating, moderation)
- Banners (multi-position)
- Dashboard (stats, revenue, best sellers)
- Notifications
- Favorites
- Addresses
- Staff & Roles
- Reports & Analytics
- Inventory Management
- Shipping Zones
- Settings (cấu hình cửa hàng)
- Blog Posts

---

## Xử lý lỗi thường gặp

### Lỗi `EADDRINUSE` (port đang bị chiếm)

```bash
# Tìm và kill process trên port
# macOS/Linux
lsof -ti:3001 | xargs kill -9
lsof -ti:3012 | xargs kill -9

# Hoặc dùng script có sẵn
bash scripts/kill-web-port.sh
```

### Lỗi `Cannot find module` sau khi checkout code mới

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### Lỗi `Prisma client not found`

```bash
pnpm db:generate
```

### Lỗi `pnpm command not found`

```bash
npm install -g pnpm
```

### Lỗi database connection

Kiểm tra PostgreSQL đang chạy:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

Kiểm tra `.env` có đúng DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hai_san_bien_xanh"
```

---

## Đóng góp

1. Fork repository
2. Tạo branch mới: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: add something'`
4. Push: `git push origin feat/your-feature`
5. Tạo Pull Request

---

## License

Private project.
