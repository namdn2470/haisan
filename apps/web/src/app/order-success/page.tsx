'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Package,
  Truck,
  Phone,
  MapPin,
  Clock,
  Home,
  ShoppingBag,
} from 'lucide-react';
import { money } from '@/lib/money';
import SiteShell from '@/components/shared/SiteShell';
import { api } from '@/lib/api';

type OrderInfo = {
  orderCode: string;
  orderId: string;
  total: number;
  customerName: string;
  shippingAddressText: string;
  deliverySlot: string;
  paymentMethod: string;
  items: { name: string; quantity: number; price: number; unit: string }[];
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount?: number;
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
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const totalAmount = Number(raw?.totalAmount ?? raw?.total_amount ?? raw?.total ?? 0);
  return {
    orderCode: raw.orderCode || raw.order_code || raw.code || '',
    orderId: raw.id || raw.orderId || '',
    total: totalAmount,
    customerName: raw.customerName || raw.customer_name || '',
    shippingAddressText: raw.shippingAddressText || raw.shipping_address_text || '',
    deliverySlot: raw.deliverySlot || raw.delivery_slot || '',
    paymentMethod: raw.paymentMethod || raw.payment_method || 'COD',
    subtotal: Number(raw?.subtotal ?? 0),
    shippingFee: Number(raw?.shippingFee ?? raw?.shipping_fee ?? 0),
    discountAmount: Number(raw?.discountAmount ?? raw?.discount_amount ?? 0),
    totalAmount: totalAmount,
    items: items.map((i: any) => ({
      name: i.productName || i.product_name || i.name || 'Sản phẩm',
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
      unit: String(i.unit || 'KG').toUpperCase(),
    })),
  };
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // First try localStorage
    const stored = localStorage.getItem('hsbx_last_order');
    let pendingId: string | null = null;
    let pendingCode: string | null = null;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = normalizeOrder(parsed);
        setOrder(normalized);
        pendingId = normalized.orderId;
        pendingCode = normalized.orderCode;
      } catch {
        // fall through
      }
    }
    setLoaded(true);

    // Then try to fetch real order from API
    if (pendingId) {
      api<{ data: any }>(`/api/orders/${pendingId}`)
        .then((res) => {
          if (res?.data) {
            setOrder(normalizeOrder(res.data));
            localStorage.setItem('hsbx_last_order', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // localStorage data is still shown
        });
    } else if (pendingCode) {
      // Try to find by orderCode
      api<{ data: any[] }>('/api/orders/my')
        .then((res) => {
          const orders = res?.data ?? [];
          const found = orders.find(
            (o: any) =>
              o.orderCode === pendingCode ||
              o.order_code === pendingCode
          );
          if (found) {
            setOrder(normalizeOrder(found));
            localStorage.setItem('hsbx_last_order', JSON.stringify(found));
          }
        })
        .catch(() => {})
        .finally(() => {});
    }
  }, []);

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  if (!loaded) {
    return (
      <SiteShell>
        <div className="order-success-container">
          <div className="order-loading">
            <div className="loading-spinner" />
            <p>Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell>
        <main className="order-success-container">
          <div className="success-card">
            <div className="success-icon">
              <Package size={64} strokeWidth={1.5} />
            </div>
            <h1 className="success-title">Chưa có đơn hàng mới</h1>
            <p className="success-subtitle">
              Bạn có thể xem lịch sử đơn hàng hoặc tiếp tục chọn hải sản tươi.
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
        </main>
      </SiteShell>
    );
  }

  const displayTotal = order.totalAmount ?? order.total;
  const displaySubtotal = order.subtotal ?? displayTotal;
  const displayShipping = order.shippingFee ?? 0;
  const displayDiscount = order.discountAmount ?? 0;

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

          <div className="order-code-badge">
            <Package size={18} />
            <span>Mã đơn hàng:</span>
            <strong>{order.orderCode || 'N/A'}</strong>
          </div>

          <div className="order-detail-grid">
            <div className="order-detail-item">
              <div className="detail-icon">
                <User2 size={18} />
              </div>
              <div>
                <small>Người nhận</small>
                <strong>{order.customerName}</strong>
              </div>
            </div>
            <div className="order-detail-item">
              <div className="detail-icon">
                <Phone size={18} />
              </div>
              <div>
                <small>Thanh toán</small>
                <strong>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</strong>
              </div>
            </div>
            <div className="order-detail-item">
              <div className="detail-icon">
                <MapPin size={18} />
              </div>
              <div>
                <small>Địa chỉ giao hàng</small>
                <strong>{order.shippingAddressText}</strong>
              </div>
            </div>
            <div className="order-detail-item">
              <div className="detail-icon">
                <Clock size={18} />
              </div>
              <div>
                <small>Khung giờ giao</small>
                <strong>{SLOT_LABELS[order.deliverySlot] || order.deliverySlot}</strong>
              </div>
            </div>
          </div>

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
