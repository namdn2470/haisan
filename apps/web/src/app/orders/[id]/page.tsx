'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Search, Phone, ArrowLeft, Truck, CheckCircle2,
  Clock, Package, MapPin, CreditCard, FileText,
} from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';

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
  { key: 'NEW', label: 'Đã đặt hàng', icon: FileText },
  { key: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Đang chuẩn bị', icon: Package },
  { key: 'DELIVERING', label: 'Đang giao hàng', icon: Truck },
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
    api<{ data: OrderDetail }>(`/api/orders/${id}`)
      .then(r => { setOrder(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order?.orderStatus);
  const st = order ? STATUS_MAP[order.orderStatus] : null;

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand"><img src={img('logo.jpg')} alt="Hải Sản Biển Xanh" /></Link>
          <div className="searchbox" style={{ flex: 1 }}><Search size={20} /><input placeholder="Tìm kiếm..." readOnly /></div>
          <Link href="/account?tab=orders" className="header-action"><ArrowLeft size={20} /><span>Đơn hàng</span></Link>
        </div>
      </header>

      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" style={{ color: 'var(--teal)', fontSize: 14 }}>Trang chủ</Link>
          <ChevronRight size={14} />
          <Link href="/account?tab=orders" style={{ fontSize: 14 }}>Đơn hàng</Link>
          <ChevronRight size={14} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>#{order?.orderCode || '...'}</span>
        </div>
      </nav>

      <main className="container" style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
        {loading ? (
          <div className="skeleton-card" style={{ height: 300 }} />
        ) : !order ? (
          <div className="empty-state">
            <h2>Không tìm thấy đơn hàng</h2>
            <Link href="/account?tab=orders" className="primary-cta" style={{ display: 'inline-flex' }}>Xem đơn hàng</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Đơn hàng #{order.orderCode}</h1>
              {st && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                  background: st.color + '18', color: st.color,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                  {st.label}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {order.orderStatus !== 'CANCELLED' && (
              <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: '#f8fafc', borderRadius: 12, padding: '20px 16px', position: 'relative' }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? '#0891b2' : '#e2e8f0', color: done ? '#fff' : '#94a3b8',
                        transition: 'all 0.3s',
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? '#0891b2' : '#94a3b8' }}>
                        {step.label}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{
                          position: 'absolute', top: 18, left: '60%', width: '80%', height: 2,
                          background: i < currentStep ? '#0891b2' : '#e2e8f0', zIndex: -1,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              {/* Left: items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Sản phẩm trong đơn</h3>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                      <img src={item.imageUrl || img('prod-tom.jpg')} alt={item.productName}
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #f1f5f9' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                        {item.variantName && <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.variantName}</div>}
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                          {money(Number(item.unitPrice))} x {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{money(Number(item.lineTotal))}</div>
                    </div>
                  ))}
                </div>

                {order.customerNote && (
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Ghi chú</h3>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{order.customerNote}</p>
                  </div>
                )}
              </div>

              {/* Right: summary + info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Tổng quan đơn hàng</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Tạm tính</span><b>{money(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount || 0))}</b></div>
                    {Number(order.discountAmount) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Giảm giá</span><b style={{ color: '#10b981' }}>-{money(Number(order.discountAmount))}</b></div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Phí giao hàng</span><b>{Number(order.shippingFee) === 0 ? <span style={{ color: '#10b981' }}>Miễn phí</span> : money(Number(order.shippingFee))}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #f1f5f9', paddingTop: 10, fontSize: 16 }}><span style={{ fontWeight: 700 }}>Tổng cộng</span><b style={{ color: '#dc2626', fontSize: 18 }}>{money(Number(order.totalAmount))}</b></div>
                  </div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Thông tin giao hàng</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <MapPin size={16} style={{ color: '#0891b2', marginTop: 2, flexShrink: 0 }} />
                      <div><div style={{ fontWeight: 600 }}>{order.customerName}</div><div style={{ color: '#64748b' }}>{order.shippingAddressText}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Phone size={16} style={{ color: '#0891b2', flexShrink: 0 }} />
                      <span>{order.customerPhone}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <CreditCard size={16} style={{ color: '#0891b2', flexShrink: 0 }} />
                      <span>{PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Clock size={16} style={{ color: '#0891b2', flexShrink: 0 }} />
                      <span>Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <Link href="/account?tab=orders" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', border: '1px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: '#64748b', textDecoration: 'none',
                }}>
                  <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
