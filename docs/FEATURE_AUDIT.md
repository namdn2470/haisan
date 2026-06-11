# FEATURE AUDIT — Hải Sản Biển Xanh / SeaFool
**Ngày audit:** 2026-06-11  
**Người thực hiện:** Claude Code  
**Scope:** Toàn bộ monorepo (apps/web, apps/api, packages/db)

---

## TÓM TẮT NHANH

| Hạng mục | Số lượng |
|---|---|
| Route frontend đã có | 23 (14 public + 9+ admin) |
| Admin page đã có | 20 |
| API module backend | 27 |
| Model Prisma | 32 |
| Chức năng hoạt động tốt | ~65% |
| Chức năng bị lỗi/thiếu | ~35% |
| Lỗi nghiêm trọng (P0) | 5 |
| Thiếu chức năng quan trọng (P1) | 8 |

---

## PHẦN 1 — ROUTE FRONTEND

### 1.1 Trang public (customer-facing)

| Route | Tồn tại | Trạng thái | Vấn đề |
|---|---|---|---|
| `/` | ✅ | Hoạt động | "Thường mua cùng" trống (DB homepage_sections rỗng) |
| `/products` | ✅ | Hoạt động tốt | OK — có filter, pagination, empty state |
| `/products/[slug]` | ✅ | Hoạt động tốt | Image fallback dùng pexels (hardcoded) |
| `/cart` | ✅ | Hoạt động tốt | Free shipping threshold 500k hardcoded |
| `/checkout` | ✅ | Hoạt động tốt | Chỉ COD hoạt động, MOMO/ZaloPay chưa tích hợp |
| `/order-success` | ✅ | Hoạt động tốt | OK |
| `/orders` | ✅ | Hoạt động tốt | Chưa có pagination |
| `/orders/[id]` | ✅ | Hoạt động tốt | OK |
| `/account` | ✅ | Hoạt động | Alert box lỗi UX kém, không có loading state tab |
| `/news` | ✅ | Đã sửa | Đã fix runtime error, cần seed bài viết |
| `/news/[slug]` | ✅ | Cảnh báo | `dangerouslySetInnerHTML` — XSS nếu content không sanitize |
| `/login` | ✅ | Redirect | Chỉ redirect → `/account?mode=login` |
| `/register` | ✅ | Redirect | Chỉ redirect → `/account?mode=register` |
| `/promotions` | ❌ | **THIẾU** | Link hardcoded ở nhiều nơi, 404 |
| `/about` | ❌ | **THIẾU** | Không có trang giới thiệu thương hiệu |
| `/contact` | ❌ | **THIẾU** | Không có trang liên hệ |
| `/policy` | ❌ | **THIẾU** | Không có trang chính sách |
| `/search` | ❌ | **THIẾU** | Không có route search riêng |

### 1.2 Trang Admin

| Route | Tồn tại | Trạng thái | Vấn đề |
|---|---|---|---|
| `/admin` | ✅ | Hoạt động | Auth redirect OK |
| `/admin/login` | ✅ | Hoạt động | OK |
| `/admin/dashboard` | ✅ | Hoạt động tốt | OK — charts, KPI, pending orders |
| `/admin/products` | ✅ | Hoạt động tốt | OK — CRUD đầy đủ, upload ảnh |
| `/admin/categories` | ✅ | Hoạt động tốt | OK |
| `/admin/orders` | ✅ | Hoạt động tốt | OK — status workflow, history |
| `/admin/customers` | ✅ | Hoạt động tốt | OK |
| `/admin/staff` | ✅ | Đã sửa | Đã fix lỗi 500 (thiếu enum SUPER_ADMIN/MANAGER) |
| `/admin/banners` | ✅ | Hoạt động | Upload ảnh qua URL (chưa có file upload) |
| `/admin/promotions` | ✅ | Hoạt động | OK — coupons CRUD |
| `/admin/posts` | ✅ | Hoạt động | OK — blog management |
| `/admin/reviews` | ✅ | Hoạt động | OK — moderation |
| `/admin/inventory` | ✅ | Hoạt động | OK — import/export/adjust |
| `/admin/delivery` | ✅ | Hoạt động | Có quản lý shipping zones tích hợp |
| `/admin/notifications` | ✅ | **LỖI** | Controller guard chặn toàn bộ (admin-only), customer không nhận được thông báo |
| `/admin/reports` | ✅ | **LỖI NGHIÊM TRỌNG** | Dùng raw `fetch()` không có Authorization header → tất cả request 401 → chart rỗng |
| `/admin/home-sections` | ✅ | Hoạt động | OK nhưng DB rỗng, cần seed data |
| `/admin/roles` | ✅ | Hoạt động | OK |
| `/admin/config` | ✅ | Hoạt động | OK |
| `/admin/settings` | ✅ | Hoạt động | OK |
| `/admin/shipping` | ❌ | **THIẾU** | Không có route riêng — gộp vào delivery page |

---

## PHẦN 2 — LỖI ĐANG XẢY RA (Bugs)

### 🔴 P0 — Nghiêm trọng, cần sửa ngay

| # | Lỗi | File | Nguyên nhân | Hướng sửa |
|---|---|---|---|---|
| B1 | **Reports page hiển thị toàn bộ chart rỗng** | `apps/web/src/app/admin/reports/page.tsx:1008-1013` | Dùng raw `fetch()` không có `Authorization: Bearer token` → API trả 401 → tất cả null | Thay bằng `adminFetch` từ `@/lib/admin/api.ts` |
| B2 | **Reports query param bị duplicate** | `apps/web/src/app/admin/reports/page.tsx:1011` | `${params}${params}&limit=10` → URL bị lặp query | Sửa thành `${params}&limit=10` |
| B3 | **"Thường mua cùng" trống** | `packages/db/prisma/` | Bảng `homepage_sections` rỗng — admin chưa config | Seed default section data hoặc hướng dẫn admin |
| B4 | **Notifications block customer** | `apps/api/src/modules/notifications/notifications.controller.ts:6` | `@Roles(...ADMIN_ROLES)` ở class-level block toàn bộ, customer không xem được thông báo đơn hàng | GET / phải public hoặc dùng JWT user ID |
| B5 | **XSS risk ở /news/[slug]** | `apps/web/src/app/news/[slug]/page.tsx` | `dangerouslySetInnerHTML={{ __html: post.content }}` — nếu content từ admin chứa script | Sanitize HTML với `DOMPurify` hoặc whitelist tags |

### 🟠 P1 — Quan trọng, ảnh hưởng UX/tính năng chính

| # | Lỗi | File | Mô tả |
|---|---|---|---|
| B6 | **Free shipping threshold hardcoded** | `apps/web/src/app/cart/page.tsx` | 500,000đ hardcoded, không đọc từ settings API |
| B7 | **Image fallback dùng pexels.com** | Nhiều trang (product, order detail, cart) | Dùng URL bên ngoài khi ảnh lỗi → có thể broken trên prod |
| B8 | **Alert box cho lỗi auth/form** | `apps/web/src/app/account/page.tsx` | `alert()` browser — UX rất xấu, cần thay bằng toast |
| B9 | **Bài viết chưa có content editor** | `apps/web/src/app/admin/posts/page.tsx` | Chỉ có textarea cho content, không có rich text editor (Quill/TipTap) |
| B10 | **Banner chỉ nhập URL, không upload file** | `apps/web/src/app/admin/banners/page.tsx` | Cần tích hợp `/api/upload/image` như admin products |
| B11 | **Homepage sections chưa có seed data** | DB | Table `homepage_sections` rỗng sau seed → "Thường mua cùng" không hiện sản phẩm |

### 🟡 P2 — Cần sửa để hoàn thiện

| # | Lỗi | Mô tả |
|---|---|---|
| B12 | Promotions page `/promotions` → 404 | Link ở nhiều component trỏ vào route không tồn tại |
| B13 | Payment methods MOMO/ZaloPay chưa tích hợp | Chỉ COD hoạt động, các phương thức khác UI "Sắp ra mắt" |
| B14 | Orders list không có pagination | Nếu user có nhiều đơn, load tất cả cùng lúc |
| B15 | AuditLog model chưa được ghi vào | Model `AuditLog` định nghĩa trong schema nhưng không có code ghi log |
| B16 | Password reset chưa có | Auth module không có forgot-password, reset-password endpoint |
| B17 | Profile.phone unique index ảnh hưởng cart guest | Guest cart dùng sessionId, nhưng nếu convert sang user có thể conflict |

---

## PHẦN 3 — CHỨC NĂNG CÒN THIẾU

### 🔴 P0 — Phải có để hệ sinh thái hoạt động

| # | Chức năng | Frontend | Backend | DB | Ghi chú |
|---|---|---|---|---|---|
| F1 | **Tích hợp thanh toán MOMO** | ❌ | ❌ | ✅ enum PaymentMethod.MOMO | Cần SDK MOMO, webhook, callback |
| F2 | **Tích hợp thanh toán ZaloPay** | ❌ | ❌ | ✅ enum PaymentMethod.ZALO_PAY | Cần SDK ZaloPay |
| F3 | **Upload ảnh banner từ file** | ❌ | ✅ `/api/upload/image` | ✅ | Chỉ cần nối UI banner với upload endpoint |

### 🟠 P1 — Quan trọng cho trải nghiệm và vận hành

| # | Chức năng | Frontend | Backend | DB | Ghi chú |
|---|---|---|---|---|---|
| F4 | **Combo sản phẩm** | ❌ | ❌ | ❌ | Cần model Combo, API, UI — đây là điểm bán hàng lớn |
| F5 | **Loyalty points / Tích điểm** | ❌ | ❌ | ❌ | Cần model LoyaltyPoint, cộng điểm khi mua, đổi điểm |
| F6 | **Thông báo khách hàng** | ❌ UI | ❌ fix guard | ✅ Notification model | Fix guard + thêm bell icon trong header |
| F7 | **Quản lý vùng giao hàng UI riêng** | ❌ (gộp delivery) | ✅ | ✅ ShippingZone | Nên tách thành `/admin/shipping-zones` riêng |
| F8 | **Forgot password / Reset password** | ❌ | ❌ | N/A | Cần OTP qua SMS hoặc email |
| F9 | **Homepage seed data** | N/A | N/A | ❌ rỗng | Seed 2-3 section mặc định để trang chủ hiện đủ block |
| F10 | **Review sau khi mua hàng** | ❌ UI | ✅ `/api/reviews POST` | ✅ Review model | Cần nút "Đánh giá" trong order detail cho customer |
| F11 | **Đánh giá hiển thị trên product detail** | ❌ | ✅ `/api/reviews GET` | ✅ | Cần section reviews ở trang sản phẩm |

### 🟡 P2 — Hoàn thiện hệ sinh thái

| # | Chức năng | Frontend | Backend | DB | Ghi chú |
|---|---|---|---|---|---|
| F12 | **Trang /about** | ❌ | N/A | Có StoreSettings | Nội dung từ settings.storeDescription |
| F13 | **Trang /contact** | ❌ | N/A | Có StoreSettings.phone/email | |
| F14 | **Trang /policy** | ❌ | N/A | Có StoreSettings.deliveryPolicy/returnPolicy | |
| F15 | **Social commerce links** | ❌ | N/A | ✅ StoreSettings có facebookUrl/zaloUrl/tiktokUrl | Cần hiển thị ở footer, header, trang chủ |
| F16 | **SEO: Open Graph cho product** | ❌ | N/A | ✅ Product có slug/description | `generateMetadata()` cho `/products/[slug]` |
| F17 | **Sitemap.xml** | ❌ | N/A | N/A | Cần `apps/web/src/app/sitemap.ts` |
| F18 | **Tìm kiếm toàn trang (search page)** | ❌ | ✅ `/api/products?search=` | ✅ | `/search?q=` route |
| F19 | **Niềm tin thương hiệu** | ❌ | N/A | ❌ thiếu model | Badge "Tươi sống 100%", nguồn gốc, cam kết hoàn tiền |
| F20 | **Rich text editor cho bài viết** | ❌ | ✅ | ✅ | TipTap hoặc Quill cho `/admin/posts` |
| F21 | **Export báo cáo PDF/Excel** | ❌ UI | ✅ `/api/reports/export/*` | N/A | Backend đã có, chỉ cần nút tải về ở UI |
| F22 | **Tracking đơn hàng real-time** | ❌ | ❌ | ✅ Delivery model | Cần websocket hoặc polling cho live status |
| F23 | **Customer loyalty tier** | ❌ | ❌ | ❌ | Hạng thành viên: Thành viên / Bạc / Vàng / VIP |
| F24 | **Zalo OA notification** | ❌ | ❌ | N/A | Gửi thông báo qua Zalo khi đặt hàng thành công |

### 🔵 P3 — Tính năng nâng cao, phát triển sau

| # | Chức năng | Ghi chú |
|---|---|---|
| F25 | **TikTok Shop integration** | Sync đơn hàng từ TikTok Shop về admin |
| F26 | **Facebook Messenger bot** | Tự động trả lời và lấy đơn qua Messenger |
| F27 | **Zalo Mini App** | Đã có enum OrderSource.ZALO_MINI_APP, cần app riêng |
| F28 | **PWA / App-like mobile** | Service worker, add to home screen |
| F29 | **Multi-warehouse inventory** | Kho ở nhiều nơi, pick từ kho gần nhất |
| F30 | **Subscription / Đặt hàng định kỳ** | "Đặt mua hàng tuần" — tính năng retention mạnh |
| F31 | **Live chat (Zalo/Facebook embed)** | Widget chat trực tiếp |
| F32 | **A/B testing banner/homepage** | Chạy thử nghiệm layout |
| F33 | **Analytics nâng cao** | Google Analytics 4, Meta Pixel, TikTok Pixel |
| F34 | **Chứng nhận VIETGAP / nguồn gốc** | Trang thông tin nguồn gốc hải sản per-product |

---

## PHẦN 4 — DATABASE AUDIT

### 4.1 Model đã có (32 models)

| Model | Trạng thái | Ghi chú |
|---|---|---|
| Profile | ✅ | User + Staff chung bảng (phân biệt bằng role) |
| Address | ✅ | Customer delivery addresses |
| Category | ✅ | Hierarchical (parent/children) |
| Product | ✅ | Full-featured với variants, images, badges |
| ProductImage | ✅ | |
| ProductVariant | ✅ | Size variants (small/medium/large/whole) |
| ProcessingService | ✅ | Dịch vụ sơ chế (làm sạch, phi lê...) |
| ProductProcessingOption | ✅ | Join table |
| Inventory | ✅ | Stock tracking với reservedQuantity |
| InventoryLog | ✅ | Import/export/adjust history |
| Cart | ✅ | Hỗ trợ cả guest (sessionId) và user |
| CartItem | ✅ | |
| DeliveryTimeSlot | ✅ | Time slots cho giao hàng |
| Order | ✅ | Đầy đủ fields, tracking source (website/mobile/zalo...) |
| OrderItem | ✅ | |
| Payment | ✅ | Multi-method (COD, bank, MOMO, ZaloPay) |
| Delivery | ✅ | Shipper assignment |
| Promotion | ✅ | Coupon/discount codes |
| OrderCoupon | ✅ | Coupon applied to order |
| Review | ✅ | Rating + comment + images + moderation |
| Favorite | ✅ | Wishlist |
| Banner | ✅ | Multiple positions (HOME_HERO, HOME_PROMO...) |
| Notification | ✅ | Order/promo/system notifications |
| AuditLog | ✅ định nghĩa | ⚠️ Chưa được ghi vào trong code |
| Post | ✅ | Blog/news |
| OrderStatusHistory | ✅ | Status change tracking |
| ShippingZone | ✅ | Province/district → shipping fee |
| CustomRole | ✅ | Dynamic permissions |
| HomepageSection | ✅ | Configurable sections |
| HomepageSectionItem | ✅ | Products per section |
| SiteConfig | ✅ | Key-value config |
| StoreSettings | ✅ | Store profile, social links, SEO |

### 4.2 Model còn thiếu so với yêu cầu

| Model cần thêm | Dùng cho | Priority |
|---|---|---|
| `Combo` / `ProductBundle` | Combo hải sản, "Set đủ món" | P1 |
| `LoyaltyPoint` | Tích điểm khách hàng | P2 |
| `LoyaltyTier` | Hạng thành viên (Silver/Gold/VIP) | P3 |
| `ProductOrigin` | Nguồn gốc hải sản, vùng đánh bắt | P2 |
| `SeafoodCertification` | VIETGAP, VietCert, HACCP badges | P3 |
| `SocialCommerce` | Facebook/TikTok/Zalo order tracking | P3 |
| `SubscriptionOrder` | Đặt hàng định kỳ hàng tuần | P3 |

---

## PHẦN 5 — API BACKEND AUDIT

### 5.1 Module đã có (27 modules đều đã đăng ký trong AppModule)

✅ auth, users, products, categories, carts, orders, payments, delivery, promotions, reviews, banners, notifications, dashboard, favorites, addresses, posts, shipping-zones, inventory, staff, roles, reports, config, settings, upload, homepage-sections

### 5.2 Lỗi trong module đã có

| Module | Vấn đề | Severity |
|---|---|---|
| notifications | `@Roles(...ADMIN_ROLES)` ở class-level → customer không nhận được notification | P0 |
| reports | Frontend dùng raw fetch không có token → 401 | P0 (frontend bug) |
| auth | Thiếu forgot-password, reset-password, change-password endpoints | P1 |
| carts | Chưa verify session ID ownership — ai có sessionId đều access được cart | P2 |
| orders | GET / không phân biệt admin vs customer list — cần kiểm tra | P2 |

### 5.3 Module còn thiếu

| Module | Endpoint cần có | Priority |
|---|---|---|
| `combo` | GET/POST/PUT/DELETE /api/combos, GET /api/combos/:slug | P1 |
| `loyalty` | GET /api/loyalty/points, POST /api/loyalty/earn, POST /api/loyalty/redeem | P2 |
| `social` | POST /api/social/orders (nhận đơn từ Facebook/TikTok) | P3 |
| `subscriptions` | CRUD /api/subscriptions | P3 |

---

## PHẦN 6 — ĐỀ XUẤT THỨ TỰ TRIỂN KHAI

### Sprint 1 — Fix lỗi P0 (1-2 ngày)

| Task | File cần sửa | Ưu tiên |
|---|---|---|
| Fix reports page: thay raw fetch bằng adminFetch + sửa duplicate params | `apps/web/src/app/admin/reports/page.tsx` | 🔴 P0 |
| Fix notifications guard: tách endpoint customer vs admin | `apps/api/src/modules/notifications/notifications.controller.ts` | 🔴 P0 |
| Fix XSS: sanitize post content với DOMPurify | `apps/web/src/app/news/[slug]/page.tsx` | 🔴 P0 |
| Seed homepage sections data (today-suggestion, buy-together) | `packages/db/prisma/seed.ts` | 🔴 P0 |
| Upload ảnh banner từ file (dùng /api/upload/image) | `apps/web/src/app/admin/banners/page.tsx` | 🔴 P0 |

### Sprint 2 — Hoàn thiện P1 (3-5 ngày)

| Task | File cần sửa/tạo |
|---|---|
| Tích hợp upload ảnh vào tất cả form cần ảnh (banners, settings, posts) | Multiple admin pages |
| Thêm review section vào trang sản phẩm (hiển thị + submit sau mua) | `apps/web/src/app/products/[slug]/page.tsx` |
| Thêm schema Combo + API + UI admin | New files |
| Fix free shipping threshold đọc từ settings | `apps/web/src/app/cart/page.tsx` + `configService.ts` |
| Thêm toast notification (thay alert) trong account page | `apps/web/src/app/account/page.tsx` |
| Thêm rich text editor cho bài viết admin | `apps/web/src/app/admin/posts/page.tsx` |
| Seed ShippingZones mặc định (HCM, HN, các tỉnh) | `packages/db/prisma/seed.ts` |

### Sprint 3 — Tính năng P2 (1-2 tuần)

| Task |
|---|
| Trang /about, /contact, /policy lấy nội dung từ StoreSettings |
| Search page `/search?q=` |
| SEO generateMetadata cho product, news |
| Sitemap.xml |
| Social links ở footer/header đọc từ StoreSettings |
| Customer loyalty points (model + API + UI) |
| Export báo cáo (nút Download ở reports page, gọi /api/reports/export/*) |
| Nguồn gốc sản phẩm (origin field + UI hiển thị badge) |

### Sprint 4 — Tính năng P3 (2-4 tuần)

| Task |
|---|
| Tích hợp MOMO payment gateway |
| Tích hợp ZaloPay |
| Zalo OA notification (gửi tin khi đặt hàng) |
| TikTok Shop sync (order import) |
| Loyalty tier (Silver/Gold/VIP) |
| Subscription / đặt hàng định kỳ |

---

## PHẦN 7 — MAPPING NHANH: FILE → API → DB

| Chức năng | Frontend file | Admin API function | Backend endpoint | DB Model |
|---|---|---|---|---|
| Reports | `admin/reports/page.tsx` | ❌ dùng raw fetch | `/api/reports/*` | Orders, Products, Profile |
| Homepage sections | `admin/home-sections/page.tsx` | `upsertHomepageSection()` | `/api/homepage-sections/:slug` | HomepageSection, HomepageSectionItem |
| Banner upload | `admin/banners/page.tsx` | `uploadImage()` | `/api/upload/image` | Banner |
| Reviews display | `products/[slug]/page.tsx` | N/A | `/api/reviews?productId=` | Review |
| Notifications bell | Header (chưa có) | `fetchNotifications()` | `/api/notifications` | Notification |
| Combo sản phẩm | ❌ chưa có | ❌ chưa có | ❌ chưa có | ❌ chưa có |
| Loyalty points | ❌ chưa có | ❌ chưa có | ❌ chưa có | ❌ chưa có |
| Social links footer | `components/shared/SiteShell.tsx` | `fetchSettings()` | `/api/settings/public` | StoreSettings |
| Free shipping config | `app/cart/page.tsx` | `getPublicConfigs()` | `/api/config/public` | SiteConfig |
| Post content sanitize | `news/[slug]/page.tsx` | N/A | N/A | N/A |

---

## PHẦN 8 — CHỨC NĂNG ĐÃ HOẠT ĐỘNG TỐT ✅

- Danh sách sản phẩm với filter, sort, pagination
- Chi tiết sản phẩm với variants, giỏ hàng
- Đặt hàng COD đầy đủ flow
- Quản lý đơn hàng admin (status workflow, history, note)
- Quản lý sản phẩm admin (CRUD + upload ảnh)
- Quản lý khuyến mãi / coupon
- Quản lý kho (import/export/adjust + log)
- Quản lý nhân viên (đã fix enum lỗi)
- Quản lý banner (tạo/sửa/xóa, thiếu file upload)
- Quản lý khách hàng
- Quản lý bài viết (thiếu rich editor)
- Quản lý đánh giá (moderation)
- Dashboard tổng quan
- Shipping zones + fee calculation
- Homepage sections config (admin + public API)
- Auth: đăng ký/đăng nhập/me
- Cart: local + sync remote
- Checkout với promo code validation
- Order tracking (status progress bar)
- Giỏ hàng yêu thích (favorites)
- Địa chỉ giao hàng

---

*Báo cáo này dựa trên source code thực tế tại thời điểm audit 2026-06-11.*  
*Sau khi audit, không sửa code cho đến khi nhận được chỉ định từ người dùng.*
