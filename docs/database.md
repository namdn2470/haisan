# Database — Hải Sản Biển Xanh

## Công nghệ
- PostgreSQL 14+ / Supabase
- Prisma ORM (schema tại `packages/db/prisma/schema.prisma`)

## Tables (19 bảng)

### Danh mục & Sản phẩm
- `categories` — Danh mục sản phẩm (có parent_id hỗ trợ cây)
- `products` — Sản phẩm (slug, badge, rating, sold_count)
- `product_images` — Nhiều ảnh / sản phẩm
- `product_variants` — Size (SKU, giá riêng, tồn kho)
- `processing_services` — Dịch vụ sơ chế
- `product_processing_options` — Map sản phẩm ↔ dịch vụ
- `inventory` — Tồn kho theo variant

### Khách hàng
- `profiles` — Hồ sơ người dùng (liên kết auth.users)
- `addresses` — Địa chỉ giao hàng

### Giỏ hàng & Đơn hàng
- `carts` / `cart_items` — Giỏ hàng
- `delivery_time_slots` — Khung giờ giao
- `orders` / `order_items` — Đơn hàng

### Thanh toán & Vận chuyển
- `payments` — Thanh toán (COD, chuyển khoản, MoMo, ZaloPay)
- `shipments` — Giao hàng, gán shipper

### Khuyến mãi & Tương tác
- `promotions` / `order_coupons` — Mã giảm giá
- `reviews` — Đánh giá (1-5 sao)
- `favorites` — Yêu thích
- `banners` — Banner đa vị trí
- `notifications` — Thông báo

### Audit
- `audit_logs` — Lịch sử thao tác admin

## Enums
- `UserRole`: customer, admin, staff, shipper
- `ProductUnit`: kg, con, combo, hop
- `ProductStatus`: active, inactive, out_of_stock
- `ProductBadge`: ban_chay, uu_dai, tuoi_ngon, moi
- `OrderStatus`: new, confirmed, preparing, delivering, completed, cancelled, returned
- `PaymentMethod`: cod, bank_transfer, momo, zalo_pay
- `DiscountType`: percent, fixed_amount, free_shipping

## Migrations
```bash
pnpm db:migrate   # Prisma migrate dev
pnpm db:seed      # Nạp dữ liệu mẫu
pnpm db:studio    # Prisma Studio UI
```

File SQL thuần (cho Supabase): `server/migrations/001_full_schema.sql`
