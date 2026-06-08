# Deployment — Hải Sản Biển Xanh

## Yêu cầu
- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 14

## Local Development

```bash
# 1. Clone & install
git clone <repo>
cd hai-san-bien-xanh
pnpm install

# 2. Database
createdb hai_san_bien_xanh
cp .env.example .env
# Sửa DATABASE_URL trong .env

# 3. Migrate & seed
pnpm db:migrate
pnpm db:seed

# 4. Run
pnpm dev
# → Web: http://localhost:3012
# → API: http://localhost:3001
```

## Seeded Admin

Sau khi chạy `pnpm db:seed`, tài khoản quản trị demo:

- Số điện thoại: `0901234567`
- Mật khẩu: `Admin@123`

Đổi mật khẩu và `JWT_SECRET` trước khi deploy production.

## Production Build

```bash
pnpm --filter @hsbx/web build
pnpm --filter @hsbx/api build
pnpm --filter @hsbx/api start
```

## Deploy

### Web (Next.js)
- Build command: `pnpm --filter @hsbx/web build`
- Output/app directory: `apps/web`
- ENV: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`

### API (NestJS)
- Build command: `pnpm --filter @hsbx/api build`
- Start command: `pnpm --filter @hsbx/api start`
- ENV: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `API_PORT`

### Database
- Supabase / Neon / Railway PostgreSQL
- Chạy migration: `pnpm db:migrate`
- Seed dữ liệu thật: `pnpm db:seed`

### Mobile (Expo)
```bash
pnpm --filter @hsbx/mobile build
eas build --platform all
```
