'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Phone, ArrowLeft, Truck, CheckCircle2,
  Clock, Package, MapPin, CreditCard, FileText,
} from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { getOrderById } from '@/services';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import type { OrderRealtimePayload } from '@/lib/socket';


type OrderItem = {
  id: string; productName: string; quantity: number; unitPrice: number; lineTotal: number;
  variantName?: string; imageUrl?: string;
};

type OrderDetail = {
  id: string; orderCode: string; orderStatus: string; totalAmount: number;
  shippingFee: number; discountAmount: number; paymentMethod: string;
  customerName: string; customerPhone: string; shippingAddressText: string;
  customerNote?: string; createdAt: string; updatedAt: string;
  items: OrderItem[];
};

const STATUS_STEPS = [
  { key: 'NEW', label: 'Đặt hàng', icon: FileText },
  { key: 'CONFIRMED', label: 'Xác nhận', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Chuẩn bị', icon: Package },
  { key: 'DELIVERING', label: 'Đang giao', icon: Truck },
  { key: 'COMPLETED', label: 'Hoàn tất', icon: CheckCircle2 },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới đặt', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
  PREPARING: { label: 'Chuẩn bị', color: '#8b5cf6' },
  DELIVERING: { label: 'Đang giao', color: '#06b6d4' },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
};

const PAYMENT_MAP: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  MOMO: 'Ví MoMo',
  ZALO_PAY: 'ZaloPay',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrderById(id)
      .then(data => { setOrder(data as OrderDetail | null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleRealtimeOrder = useCallback((payload: OrderRealtimePayload) => {
    setOrder(prev => {
      if (!prev || (payload.id !== prev.id && payload.orderCode !== prev.orderCode)) return prev;
      return {
        ...prev,
        orderStatus: payload.status || prev.orderStatus,
        totalAmount: payload.totalAmount ?? prev.totalAmount,
        updatedAt: payload.updatedAt || prev.updatedAt,
      };
    });
  }, []);

  useOrderRealtime({
    enabled: !!order?.id,
    orderId: order?.id,
    onOrderUpdated: handleRealtimeOrder,
    onOrderStatusChanged: handleRealtimeOrder,
  });

  if (loading) {
    return (
      <main className="hs-container hs-page-main" style={{ maxWidth: 1040 }}>
        <div className="skeleton-card" style={{ height: 300 }} />
      </main>
    );
  }

  if (!order) {
    notFound();
    return null;
  }

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.orderStatus);
  const st = STATUS_MAP[order.orderStatus];

  return (
    <main className="hs-container hs-page-main" style={{ maxWidth: 1040 }}>
      {/* Breadcrumb */}
      <div className="hs-breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/orders">Đơn hàng</Link>
        <span>/</span>
        <span>#{order.orderCode}</span>
      </div>

      {/* Header: title + status badge */}
      <div className="od-header">
        <h1 className="od-header-title">Đơn hàng #{order.orderCode}</h1>
        {st && (
          <span className="od-badge" style={{ background: st.color + '18', color: st.color }}>
            <span className="od-badge-dot" style={{ background: st.color }} />
            {st.label}
          </span>
        )}
      </div>

      {/* Status timeline */}
      {order.orderStatus !== 'CANCELLED' && (
        <div className="od-timeline-wrap">
          <div className="od-timeline">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="od-step">
                  <div className={`od-step-icon ${done ? 'od-step-icon--done' : 'od-step-icon--pending'}`}>
                    <Icon size={16} />
                  </div>
                  <div className={`od-step-label ${done ? 'od-step-label--done' : 'od-step-label--pending'}`}>
                    {step.label}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className="od-step-connector"
                      style={{ background: i < currentStep ? '#0891b2' : '#e2e8f0' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main grid: 1-col mobile → 2-col desktop */}
      <div className="od-grid">
        {/* Left column: items + note */}
        <div className="od-col">
          <div className="od-card">
            <h3 className="od-card-title">Sản phẩm trong đơn</h3>
            {order.items.map(item => (
              <div key={item.id} className="od-item">
                <img
                  src={item.imageUrl || img('prod-tom.jpg')}
                  alt={item.productName}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.dataset.fallback) {
                      t.dataset.fallback = 'true';
                      t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=200';
                    }
                  }}
                  className="od-item-img"
                />
                <div className="od-item-body">
                  <div className="od-item-name">{item.productName}</div>
                  {item.variantName && <div className="od-item-variant">{item.variantName}</div>}
                  <div className="od-item-qty">{money(Number(item.unitPrice))} × {item.quantity}</div>
                </div>
                <div className="od-item-total">{money(Number(item.lineTotal))}</div>
              </div>
            ))}
          </div>

          {order.customerNote && (
            <div className="od-card">
              <h3 className="od-card-title" style={{ marginBottom: 8 }}>Ghi chú</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{order.customerNote}</p>
            </div>
          )}
        </div>

        {/* Right column: summary + shipping + back */}
        <div className="od-col">
          <div className="od-card">
            <h3 className="od-card-title">Tổng quan đơn hàng</h3>
            <div className="od-summary-row">
              <span className="od-summary-label">Tạm tính</span>
              <b>{money(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount || 0))}</b>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="od-summary-row">
                <span className="od-summary-label">Giảm giá</span>
                <b style={{ color: '#10b981' }}>-{money(Number(order.discountAmount))}</b>
              </div>
            )}
            <div className="od-summary-row">
              <span className="od-summary-label">Phí giao hàng</span>
              <b>
                {Number(order.shippingFee) === 0
                  ? <span style={{ color: '#10b981' }}>Miễn phí</span>
                  : money(Number(order.shippingFee))}
              </b>
            </div>
            <div className="od-summary-total">
              <span style={{ fontWeight: 700 }}>Tổng cộng</span>
              <b style={{ color: '#dc2626', fontSize: 18 }}>{money(Number(order.totalAmount))}</b>
            </div>
          </div>

          <div className="od-card">
            <h3 className="od-card-title">Thông tin giao hàng</h3>
            <div className="od-info-row">
              <MapPin size={16} className="od-info-icon" />
              <div>
                <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                <div style={{ color: '#64748b' }}>{order.shippingAddressText}</div>
              </div>
            </div>
            <div className="od-info-row">
              <Phone size={16} className="od-info-icon" />
              <span>{order.customerPhone}</span>
            </div>
            <div className="od-info-row">
              <CreditCard size={16} className="od-info-icon" />
              <span>{PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="od-info-row">
              <Clock size={16} className="od-info-icon" />
              <span>Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <Link href="/account?tab=orders" className="od-back-btn">
            <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
