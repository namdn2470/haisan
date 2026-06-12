'use client';

/* ============================================================
   SHARED MOBILE ADMIN CARD COMPONENTS
   Used by admin pages on mobile screens (lg:hidden)
   ============================================================ */

import { Edit2, Trash2, Eye, CheckCircle, XCircle, Clock, Package, Star } from 'lucide-react';

// ——— Status badge ———
type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'cyan';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-600 ring-red-200',
  yellow: 'bg-amber-50 text-amber-600 ring-amber-200',
  blue: 'bg-blue-50 text-blue-600 ring-blue-200',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-purple-50 text-purple-600 ring-purple-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
};

export function AdmStatusBadge({
  label,
  variant = 'gray',
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${BADGE_STYLES[variant]}`}>
      {label}
    </span>
  );
}

// ——— Star rating ———
export function AdmStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
}

// ——— Order card ———
export function AdmOrderCard({
  order,
  onView,
  onUpdateStatus,
}: {
  order: {
    id: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    status: string;
    total: number;
    createdAt?: string;
    itemCount?: number;
  };
  onView?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('vi-VN').format(v) + 'đ';

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    NEW: { label: 'Mới', variant: 'blue' },
    CONFIRMED: { label: 'Đã xác nhận', variant: 'cyan' },
    PREPARING: { label: 'Đang chuẩn bị', variant: 'yellow' },
    DELIVERING: { label: 'Đang giao', variant: 'purple' },
    COMPLETED: { label: 'Hoàn thành', variant: 'green' },
    CANCELLED: { label: 'Đã hủy', variant: 'red' },
  };

  const s = statusMap[order.status] ?? { label: order.status, variant: 'gray' as BadgeVariant };

  return (
    <article className="adm-mobile-card">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-400">
            #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-0.5 text-sm font-black text-slate-900">{order.customerName ?? 'Khách hàng'}</p>
          <p className="text-xs text-slate-500">{order.customerPhone}</p>
        </div>
        <AdmStatusBadge label={s.label} variant={s.variant} />
      </div>

      {/* Meta */}
      <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
        {order.itemCount !== undefined && (
          <span className="flex items-center gap-1">
            <Package size={12} />
            {order.itemCount} sản phẩm
          </span>
        )}
        {order.createdAt && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {fmtDate(order.createdAt)}
          </span>
        )}
      </div>

      {/* Total */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">Tổng cộng</span>
        <span className="text-base font-black text-slate-900">{fmt(order.total)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onView && (
          <button
            onClick={() => onView(order.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-colors active:bg-slate-200"
          >
            <Eye size={14} />
            Chi tiết
          </button>
        )}
        {onUpdateStatus && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white transition-colors active:bg-blue-700"
            >
              <CheckCircle size={14} />
              Xác nhận
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-colors active:bg-red-100"
            >
              <XCircle size={16} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

// ——— Product card ———
export function AdmProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    stockQuantity?: number;
    isActive?: boolean;
    image?: string;
    sku?: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('vi-VN').format(v) + 'đ';

  const lowStock = product.stockQuantity !== undefined && product.stockQuantity <= 5;
  const outOfStock = product.stockQuantity === 0;

  return (
    <article className="adm-mobile-card">
      <div className="flex gap-3">
        {/* Image */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={24} className="text-slate-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{product.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{product.category ?? 'Chưa phân loại'}</p>
            </div>
            <AdmStatusBadge
              label={product.isActive ? 'Đang bán' : 'Ẩn'}
              variant={product.isActive ? 'green' : 'gray'}
            />
          </div>

          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-black text-blue-600">{fmt(product.price)}</p>
              {product.stockQuantity !== undefined && (
                <p className={`mt-0.5 text-xs font-bold ${outOfStock ? 'text-red-500' : lowStock ? 'text-amber-500' : 'text-slate-400'}`}>
                  {outOfStock ? 'Hết hàng' : lowStock ? `Còn ${product.stockQuantity}` : `Tồn: ${product.stockQuantity}`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(product.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors active:bg-slate-200"
                >
                  <Edit2 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors active:bg-red-100"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ——— Banner card ———
export function AdmBannerCard({
  banner,
  onEdit,
  onDelete,
}: {
  banner: any;
  onEdit?: (id: any) => void;
  onDelete?: (id: any) => void;
}) {
  return (
    <article className="adm-mobile-card">
      <div className="flex gap-3">
        {/* Image */}
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {banner.image ? (
            <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={20} className="text-slate-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{banner.title}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{banner.position ?? 'Banner'}</p>
            </div>
            <AdmStatusBadge
              label={banner.isActive ? 'Hiển thị' : 'Ẩn'}
              variant={banner.isActive ? 'green' : 'gray'}
            />
          </div>

          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-xs text-slate-400">
              Thứ tự: <span className="font-bold text-slate-600">{banner.sortOrder ?? 0}</span>
            </p>
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(banner.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors active:bg-slate-200"
                >
                  <Edit2 size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(banner.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors active:bg-red-100"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ——— Review card ———
export function AdmReviewCard({
  review,
  onApprove,
  onReject,
}: {
  review: any;
  onApprove?: (id: any) => void;
  onReject?: (id: any) => void;
}) {
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

  return (
    <article className="adm-mobile-card">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">{review.customerName ?? 'Khách hàng'}</p>
          <p className="mt-0.5 text-xs text-slate-400">{review.productName}</p>
        </div>
        <AdmStatusBadge
          label={review.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}
          variant={review.isApproved ? 'green' : 'yellow'}
        />
      </div>

      {/* Rating */}
      <div className="mb-2">
        <AdmStarRating rating={review.rating} />
      </div>

      {/* Content */}
      {review.content && (
        <p className="mb-3 line-clamp-2 text-sm text-slate-600">{review.content}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{fmtDate(review.createdAt)}</span>
        <div className="flex items-center gap-2">
          {onApprove && !review.isApproved && (
            <button
              onClick={() => onApprove(review.id)}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 transition-colors active:bg-emerald-100"
            >
              <CheckCircle size={14} />
              Duyệt
            </button>
          )}
          {onReject && !review.isApproved && (
            <button
              onClick={() => onReject(review.id)}
              className="flex items-center gap-1.5 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500 transition-colors active:bg-red-100"
            >
              <XCircle size={14} />
              Từ chối
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ——— Inventory card ———
export function AdmInventoryCard({
  item,
  onRestock,
}: {
  item: any;
  onRestock?: (id: any) => void;
}) {
  const threshold = item.lowStockThreshold ?? 5;
  const lowStock = item.stockQuantity <= threshold;
  const outOfStock = item.stockQuantity === 0;

  return (
    <article className="adm-mobile-card">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">{item.productName}</p>
          {item.sku && <p className="mt-0.5 text-xs text-slate-400">SKU: {item.sku}</p>}
        </div>
        {outOfStock ? (
          <AdmStatusBadge label="Hết hàng" variant="red" />
        ) : lowStock ? (
          <AdmStatusBadge label="Sắp hết" variant="yellow" />
        ) : (
          <AdmStatusBadge label="Còn hàng" variant="green" />
        )}
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">Tồn kho</p>
          <p className={`text-xl font-black ${outOfStock ? 'text-red-500' : lowStock ? 'text-amber-500' : 'text-slate-900'}`}>
            {item.stockQuantity}
          </p>
        </div>
        <p className="text-xs text-slate-400">Ngưỡng: {threshold}</p>
      </div>

      {onRestock && (
        <button
          onClick={() => onRestock(item.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors active:bg-blue-700"
        >
          <Package size={15} />
          Nhập kho
        </button>
      )}
    </article>
  );
}

// ——— Category card ———
export function AdmCategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: {
    id: string;
    name: string;
    productCount?: number;
    isActive?: boolean;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <article className="adm-mobile-card">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{category.name}</p>
          {category.productCount !== undefined && (
            <p className="mt-0.5 text-xs text-slate-400">{category.productCount} sản phẩm</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AdmStatusBadge
            label={category.isActive ? 'Hiển thị' : 'Ẩn'}
            variant={category.isActive ? 'green' : 'gray'}
          />
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                onClick={() => onEdit(category.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors active:bg-slate-200"
              >
                <Edit2 size={15} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(category.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors active:bg-red-100"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ——— Stat card (for dashboard) ———
export function AdmStatCard({
  label,
  value,
  subtext,
  icon,
  accentColor = 'blue',
}: {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-500',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-500',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="adm-mobile-card">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors[accentColor] ?? colors.blue}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

// ——— Empty state ———
export function AdmMobileEmpty({
  message = 'Không có dữ liệu',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Package size={28} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}

// ——— Page header ———
export function AdmPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-black text-slate-900 lg:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

// ——— Safe array helper ———
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'items', 'products', 'orders', 'banners', 'reviews', 'customers']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}
