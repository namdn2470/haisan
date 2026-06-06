# API Documentation — Hải Sản Biển Xanh

Base URL: `http://localhost:3001/api`

## Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |

## Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Danh sách danh mục |
| GET | `/api/categories/:id` | Chi tiết danh mục |
| POST | `/api/categories` | Thêm danh mục (admin) |
| PUT | `/api/categories/:id` | Cập nhật (admin) |
| DELETE | `/api/categories/:id` | Xóa (admin) |

## Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Danh sách (query: category, search, sort) |
| GET | `/api/products/slug/:slug` | Chi tiết theo slug |
| GET | `/api/products/:id` | Chi tiết theo ID |
| POST | `/api/products` | Thêm (admin) |
| PUT | `/api/products/:id` | Cập nhật (admin) |
| DELETE | `/api/products/:id` | Xóa (admin) |

## Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Giỏ hàng của user |
| POST | `/api/cart/add` | Thêm vào giỏ |
| PUT | `/api/cart/:id` | Cập nhật số lượng |
| DELETE | `/api/cart/:id` | Xóa item |
| DELETE | `/api/cart` | Xóa toàn bộ giỏ |

## Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Đơn hàng của user |
| GET | `/api/orders/:id` | Chi tiết đơn |
| POST | `/api/orders` | Tạo đơn hàng |
| PUT | `/api/orders/:id/status` | Cập nhật trạng thái (admin) |

## Dashboard (admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Thống kê tổng quan |
| GET | `/api/dashboard/revenue` | Doanh thu 30 ngày |
| GET | `/api/dashboard/best-sellers` | Sản phẩm bán chạy |
