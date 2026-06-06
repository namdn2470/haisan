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
# → Web: http://localhost:3000
# → API: http://localhost:3001
```

## Production Build

```bash
pnpm build
pnpm --filter @hsbx/api start
```

## Deploy

### Web (Next.js)
- Vercel: `pnpm build` → deploy `apps/web`
- ENV: `NEXT_PUBLIC_API_URL`

### API (NestJS)
- Railway / Render / Docker: `pnpm build` then `node apps/api/dist/main`

### Database
- Supabase / Neon / Railway PostgreSQL
- Chạy migration: `pnpm db:migrate`

### Mobile (Expo)
```bash
pnpm --filter @hsbx/mobile build
eas build --platform all
```
