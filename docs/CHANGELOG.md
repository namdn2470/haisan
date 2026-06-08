# Changelog

## Admin/Web Stability Checkpoint (2026-06-08)

Các thay đổi trong checkpoint này tập trung vào bảo mật, dọn dẹp dead code,
và chuẩn hóa API client.

### Security
- **Protected GET /api/orders/:id** — removed `@Public()` decorator; non-admin
  users can only see their own orders via `findFirst` with `userId` filter.
- **JWT config** — uses `process.env.JWT_SECRET` with safe dev fallback,
  no hardcoded secrets in source.

### Notifications
- **Fixed invalid notification type mapping** — `COMPLETED` → `ORDER_DELIVERED`;
  all other statuses → `SYSTEM` (enum does not include `ORDER_CANCELLED`).

### Payment
- **Disabled unsupported MOMO / ZALO_PAY** — backend throws
  `BadRequestException` for these methods; frontend shows disabled state
  with "Sắp ra mắt" badge.

### Cleanup
- **Removed dead `adminService.ts`** (354 lines, zero real imports);
  migrated remaining type usages to inline types in `NotificationList.tsx`
  and `TopProducts.tsx`.

### API Client
- **Added shared `unwrapApiData<T>()` / `unwrapApiList<T>()` helper**
  in `apps/web/src/lib/api-response.ts`.
- **Applied to** `productService.ts`, `orderService.ts`, `postService.ts`
  for consistent response unwrapping.

### Tests
- Build (API + Web + Mobile) — PASS
- Lint (10 packages) — PASS, 0 warnings
- DB CRUD tests — 65/65 PASS
- DB e2e flow tests — 19/19 PASS
- DB data integrity check — PASS
