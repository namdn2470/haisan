# 🦐 Hải Sản Biển Xanh

Hệ thống bán hải sản tươi sống online đa nền tảng.

## Cấu trúc monorepo

```
hai-san-bien-xanh/
├── apps/
│   ├── web/          # Next.js — Website bán hàng
│   ├── mobile/       # Expo — Mobile App
│   └── api/          # NestJS — Backend API
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

## Bắt đầu nhanh

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: `docs/api.md`

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Chạy toàn bộ (web + api) |
| `pnpm build` | Build production |
| `pnpm db:migrate` | Chạy Prisma migration |
| `pnpm db:seed` | Nạp dữ liệu mẫu |
| `pnpm db:studio` | Mở Prisma Studio |
| `pnpm lint` | Kiểm tra lint |
| `pnpm format` | Format code |

## Modules API

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
