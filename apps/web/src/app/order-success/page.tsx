'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  Truck,
  Phone,
  MapPin,
  Clock,
  Home,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { money } from '@/lib/money';
import SiteShell from '@/components/shared/SiteShell';
import { api, getApiBaseUrl } from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getOrders } from '@/services/orderService';

type OrderInfo = {
  orderCode: string;
  orderId: string;
  total: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddressText: string;
  deliverySlot: string;
  paymentMethod: string;
  note?: string;
  items: { name: string; quantity: number; price: number; unit: string; imageUrl?: string }[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus?: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  MOMO: 'Ví MoMo',
  ZALO_PAY: 'ZaloPay',
};

const SLOT_LABELS: Record<string, string> = {
  '08:00-10:00': '08:00 - 10:00 sáng',
  '14:00-16:00': '14:00 - 16:00 chiều',
  '18:00-20:00': '18:00 - 20:00 tối',
};

function normalizeOrder(raw: any): OrderInfo {
  const rawItems: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.orderItems)
    ? raw.orderItems
    : [];

  const subtotal = Number(
    raw?.subtotal ?? raw?.sub_total ?? raw?.items?.reduce(
      (s: number, i: any) => s + Number(i.price ?? i.unitPrice ?? i.unit_price ?? 0) * Number(i.quantity ?? 1),
      0
    ) ?? 0
  );
  const shippingFee = Number(raw?.shippingFee ?? raw?.shipping_fee ?? 0);
  const discountAmount = Number(raw?.discountAmount ?? raw?.discount_amount ?? 0);
  const totalAmount = Number(raw?.totalAmount ?? raw?.total_amount ?? raw?.total ?? 0);

  return {
    orderCode: raw.orderCode || raw.order_code || raw.code || '',
    orderId: raw.id || raw.orderId || '',
    total: totalAmount,
    customerName: raw.customerName || raw.customer_name || '',
    customerPhone: raw.customerPhone || raw.customer_phone || '',
    customerEmail: raw.customerEmail || raw.customer_email || '',
    shippingAddressText: raw.shippingAddressText || raw.shipping_address_text || '',
    deliverySlot: raw.deliverySlot || raw.delivery_slot || '',
    paymentMethod: raw.paymentMethod || raw.payment_method || 'COD',
    note: raw.note || raw.customerNote || raw.customer_note || '',
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    orderStatus: raw.orderStatus || raw.order_status || 'NEW',
    items: rawItems.map((i: any) => ({
      name: i.productName || i.product_name || i.name || 'Sản phẩm',
      quantity: Number(i.quantity || 1),
      price: Number(i.price ?? i.unitPrice ?? i.unit_price ?? 0),
      unit: String(i.unit || i.variantName || 'KG').toUpperCase(),
      imageUrl: i.imageUrl || i.image_url || '',
    })),
  };
}

async function fetchOrderByCode(orderCode: string): Promise<OrderInfo | null> {
  const base = getApiBaseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/orders/code/${encodeURIComponent(orderCode)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const raw = (json as any).data ?? json;
    if (!raw || !raw.orderCode) return null;
    return normalizeOrder(raw);
  } catch {
    return null;
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderCodeFromUrl = searchParams.get('orderCode') || '';

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load order from URL param
  useEffect(() => {
    if (!orderCodeFromUrl) {
      setLoading(false);
      return;
    }

    fetchOrderByCode(orderCodeFromUrl).then((o) => {
      if (o) {
        setOrder(o);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [orderCodeFromUrl]);

  // Countdown
  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  if (loading) {
    return (
      <div className="order-success-container">
        <div className="order-loading">
          <Loader2 size={40} className="spin" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (notFound || (!order && !orderCodeFromUrl)) {
    return (
      <div className="order-success-container">
        <div className="success-card">
          <div className="success-icon">
            <Package size={64} strokeWidth={1.5} />
          </div>
          <h1 className="success-title">
            {notFound ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng mới'}
          </h1>
          <p className="success-subtitle">
            {notFound
              ? `Không tìm thấy đơn hàng "${orderCodeFromUrl}". Vui lòng kiểm tra lại mã đơn.`
              : 'Bạn có thể xem lịch sử đơn hàng hoặc tiếp tục chọn hải sản tươi.'}
          </p>
          <div className="success-actions">
            <Link href="/orders" className="action-primary">
              <ShoppingBag size={18} />
              Xem đơn hàng
            </Link>
            <Link href="/products" className="action-secondary">
              <Home size={18} />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Still loading order — show basic skeleton
  if (!order) return null;

  const displayTotal = order.totalAmount || order.total;
  const displaySubtotal = order.subtotal || displayTotal;
  const displayShipping = order.shippingFee;
  const displayDiscount = order.discountAmount;

  return (
    <>
      <div className="order-code-badge">
        <Package size={18} />
        <span>Mã đơn hàng:</span>
        <strong>{order.orderCode || 'N/A'}</strong>
      </div>

      <div className="order-detail-grid">
        {order.customerName && (
          <div className="order-detail-item">
            <div className="detail-icon">
              <User2 size={18} />
            </div>
            <div>
              <small>Người nhận</small>
              <strong>{order.customerName}</strong>
            </div>
          </div>
        )}
        {order.customerPhone && (
          <div className="order-detail-item">
            <div className="detail-icon">
              <Phone size={18} />
            </div>
            <div>
              <small>Điện thoại</small>
              <strong>{order.customerPhone}</strong>
            </div>
          </div>
        )}
        {order.paymentMethod && (
          <div className="order-detail-item">
            <div className="detail-icon">
              <Phone size={18} />
            </div>
            <div>
              <small>Thanh toán</small>
              <strong>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</strong>
            </div>
          </div>
        )}
        {order.shippingAddressText && (
          <div className="order-detail-item">
            <div className="detail-icon">
              <MapPin size={18} />
            </div>
            <div>
              <small>Địa chỉ giao hàng</small>
              <strong>{order.shippingAddressText}</strong>
            </div>
          </div>
        )}
        {order.deliverySlot && (
          <div className="order-detail-item">
            <div className="detail-icon">
              <Clock size={18} />
            </div>
            <div>
              <small>Khung giờ giao</small>
              <strong>{SLOT_LABELS[order.deliverySlot] || order.deliverySlot}</strong>
            </div>
          </div>
        )}
        {order.note && (
          <div className="order-detail-item" style={{ gridColumn: '1 / -1' }}>
            <div className="detail-icon">
              <Package size={18} />
            </div>
            <div>
              <small>Ghi chú</small>
              <strong>{order.note}</strong>
            </div>
          </div>
        )}
      </div>

      {order.items.length > 0 && (
        <div className="success-items">
          <h3>Sản phẩm đã đặt</h3>
          {order.items.map((item, i) => (
            <div className="success-item" key={i}>
              <span className="success-item-name">{item.name}</span>
              <span className="success-item-qty">x{item.quantity} {item.unit}</span>
              <span className="success-item-price">{money(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="success-breakdown">
        <div className="breakdown-row">
          <span>Tạm tính</span>
          <span>{money(displaySubtotal)}</span>
        </div>
        {displayDiscount > 0 && (
          <div className="breakdown-row discount">
            <span>Giảm giá</span>
            <span>-{money(displayDiscount)}</span>
          </div>
        )}
        <div className="breakdown-row">
          <span>Phí giao hàng</span>
          <span>{displayShipping === 0 ? 'Miễn phí' : money(displayShipping)}</span>
        </div>
      </div>

      <div className="success-total">
        <span>Tổng thanh toán</span>
        <strong>{money(displayTotal)}</strong>
      </div>

      <div className="success-notice">
        <Truck size={16} />
        <p>
          Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ gọi điện xác nhận trong ít phút.
        </p>
      </div>

      <div className="success-actions">
        <Link href={`/orders/${order.orderId}`} className="action-primary">
          <ShoppingBag size={18} />
          Xem chi tiết đơn hàng
        </Link>
        <Link href="/products" className="action-secondary">
          <Home size={18} />
          Tiếp tục mua sắm
        </Link>
      </div>

      {countdown > 0 && (
        <p className="redirect-hint">
          Tự động chuyển về trang chủ sau {countdown}s...
        </p>
      )}
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <SiteShell>
      <main className="order-success-container">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle2 size={64} strokeWidth={1.5} />
          </div>

          <h1 className="success-title">Đặt hàng thành công!</h1>
          <p className="success-subtitle">
            Cảm ơn bạn đã đặt hàng tại Hải Sản Biển Xanh
          </p>

          <Suspense fallback={
            <div className="order-loading">
              <Loader2 size={40} className="spin" />
              <p>Đang tải thông tin đơn hàng...</p>
            </div>
          }>
            <OrderSuccessContent />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}

function User2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
