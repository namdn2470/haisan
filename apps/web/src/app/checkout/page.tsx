'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, Banknote, Smartphone, Truck, ShieldCheck, Search, ArrowLeft } from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';

type CartItem = {
  id: string;
  quantity: number;
  selectedUnit: string;
  priceAtTime: number;
  product: { name: string; images?: { imageUrl: string }[] };
  variant?: { name: string };
};

type CartData = { id: string; items: CartItem[] };

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng', icon: <Banknote size={20} /> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: <CreditCard size={20} /> },
  { value: 'MOMO', label: 'Ví MoMo', icon: <Smartphone size={20} /> },
  { value: 'ZALO_PAY', label: 'ZaloPay', icon: <Smartphone size={20} /> },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddressText: '',
    deliveryDate: '',
    paymentMethod: 'COD',
    customerNote: '',
  });

  useEffect(() => {
    api<{ data: CartData }>('/api/carts').then(r => {
      setCart(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const r = await api<{ data: any }>(`/api/promotions/code/${encodeURIComponent(couponCode.trim())}`);
      if (r.data && r.data.discountValue) {
        const promo = r.data;
        const disc = promo.discountType === 'PERCENTAGE'
          ? Math.round(subtotal * Number(promo.discountValue) / 100)
          : Number(promo.discountValue);
        setCouponDiscount(disc);
        setCouponApplied(promo.code || couponCode.trim());
      }
    } catch {
      setCouponError('Mã giảm giá không hợp lệ');
      setCouponDiscount(0);
      setCouponApplied('');
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.priceAtTime) * Number(i.quantity), 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal - couponDiscount + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.shippingAddressText) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: form.customerName,
          customer_phone: form.customerPhone,
          customer_email: form.customerEmail || undefined,
          shipping_address_text: form.shippingAddressText,
          delivery_date: form.deliveryDate || undefined,
          payment_method: form.paymentMethod,
          shipping_fee: shippingFee,
          coupon_code: couponApplied || undefined,
          discount_amount: couponDiscount || undefined,
          note: form.customerNote || undefined,
        }),
      });
      router.push('/account?tab=orders&success=1');
    } catch {
      setSubmitError('Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin.');
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand"><img src={img('logo.jpg')} alt="Hải Sản Biển Xanh" /></Link>
          <div className="searchbox" style={{ flex: 1 }}><Search size={20} /><input placeholder="Tìm kiếm hải sản..." readOnly /></div>
          <Link href="/cart" className="header-action"><ArrowLeft size={20} /><span>Quay lại giỏ hàng</span></Link>
        </div>
      </header>

      <nav className="nav">
        <div className="container nav-inner">
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Thanh toán đơn hàng</h1>
        </div>
      </nav>

      <main className="container checkout-page">
        <div className="breadcrumb">
          <Link href="/">Trang chủ</Link> <ChevronRight size={14} />
          <Link href="/cart">Giỏ hàng</Link> <ChevronRight size={14} />
          Thanh toán
        </div>

        {loading ? (
          <div className="loading-grid"><div className="skeleton-card" style={{ height: 400 }} /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h2>Giỏ hàng trống</h2>
            <Link href="/products" className="primary-cta" style={{ display: 'inline-flex' }}>Mua sắm ngay</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkout-layout">
            <section className="checkout-form">
              <h2>Thông tin giao hàng</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input type="text" required value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input type="tel" required value={form.customerPhone} onChange={e => update('customerPhone', e.target.value)} placeholder="0901 234 567" />
                </div>
                <div className="form-group full">
                  <label>Email</label>
                  <input type="email" value={form.customerEmail} onChange={e => update('customerEmail', e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="form-group full">
                  <label>Địa chỉ giao hàng *</label>
                  <input type="text" required value={form.shippingAddressText} onChange={e => update('shippingAddressText', e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
                </div>
                <div className="form-group">
                  <label>Ngày giao hàng</label>
                  <input type="date" value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea value={form.customerNote} onChange={e => update('customerNote', e.target.value)} placeholder="Ghi chú cho đơn hàng..." rows={3} />
                </div>
              </div>

              <h2>Phương thức thanh toán</h2>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className={`payment-option ${form.paymentMethod === m.value ? 'active' : ''}`}>
                    <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value} onChange={e => update('paymentMethod', e.target.value)} />
                    <span className="payment-icon">{m.icon}</span>
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <aside className="checkout-summary">
              <h2>Đơn hàng của bạn</h2>
              <div className="order-items">
                {items.map(item => (
                  <div className="order-item" key={item.id}>
                    <img src={item.product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={item.product.name} />
                    <div>
                      <b>{item.product.name}</b>
                      {item.variant && <small>{item.variant.name}</small>}
                      <p>x{Number(item.quantity)} {money(Number(item.priceAtTime))}</p>
                    </div>
                    <strong>{money(Number(item.priceAtTime) * Number(item.quantity))}</strong>
                  </div>
                ))}
              </div>
              <div className="coupon-box" style={{ display: 'flex', gap: 8, margin: '16px 0', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
                />
                <button type="button" onClick={applyCoupon}
                  style={{ padding: '10px 16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Áp dụng
                </button>
              </div>
              {couponApplied && (
                <p style={{ color: '#10b981', fontSize: 13, margin: '-8px 0 12px' }}>
                  Đã áp dụng mã: <b>{couponApplied}</b> (-{money(couponDiscount)})
                </p>
              )}
              {couponError && (
                <p style={{ color: '#ef4444', fontSize: 13, margin: '-8px 0 12px' }}>{couponError}</p>
              )}
              <div className="summary-lines">
                <div><span>Tạm tính</span><b>{money(subtotal)}</b></div>
                {couponDiscount > 0 && (
                  <div><span>Giảm giá</span><b style={{ color: '#10b981' }}>-{money(couponDiscount)}</b></div>
                )}
                <div><span>Phí giao hàng</span><b>{shippingFee === 0 ? <span className="green">Miễn phí</span> : money(shippingFee)}</b></div>
                <div className="total"><span>Tổng tiền</span><b>{money(total > 0 ? total : 0)}</b></div>
              </div>
              {submitError && (
                <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>{submitError}</p>
              )}
              <button type="submit" className="buy-cta" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
              </button>
              <div className="checkout-trust">
                <p><ShieldCheck size={16} /> Bảo mật thông tin</p>
                <p><Truck size={16} /> Giao hàng đúng hẹn</p>
              </div>
            </aside>
          </form>
        )}
      </main>
    </>
  );
}
