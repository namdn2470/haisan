'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';

import {
  calculatePromotionDiscount,
  createOrder,
  getPromotionByCode,
  validatePromotion,
} from '@/services';
import { getShippingQuote } from '@/services/shippingService';

type PaymentMethodOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: <Banknote size={20} /> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: <CreditCard size={20} /> },
  { value: 'MOMO', label: 'Ví MoMo', icon: <Smartphone size={20} />, disabled: true, badge: 'Sắp ra mắt' },
  { value: 'ZALO_PAY', label: 'ZaloPay', icon: <Smartphone size={20} />, disabled: true, badge: 'Sắp ra mắt' },
];

const DELIVERY_SLOTS = [
  { value: '08:00-10:00', label: '08:00 - 10:00', time: 'Buổi sáng' },
  { value: '14:00-16:00', label: '14:00 - 16:00', time: 'Buổi chiều' },
  { value: '18:00-20:00', label: '18:00 - 20:00', time: 'Buổi tối' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getSubtotal } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine: '',
    province: '',
    district: '',
    deliverySlot: '08:00-10:00',
    paymentMethod: 'COD',
    customerNote: '',
  });

  const subtotal = getSubtotal();

  const shippingAddressText = useMemo(() => {
    const parts = [form.addressLine, form.district, form.province].filter(Boolean);
    return parts.join(', ');
  }, [form.addressLine, form.district, form.province]);

  const total = Math.max(0, subtotal + shippingFee - couponDiscount);

  useEffect(() => {
    let cancelled = false;
    setShippingLoading(true);
    getShippingQuote({
      province: form.province || undefined,
      district: form.district || undefined,
      subtotal,
    }).then((res) => {
      if (cancelled) return;
      setShippingFee(res?.shippingFee ?? 0);
      setShippingLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setShippingLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [form.province, form.district, subtotal]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');

    // Try new validate endpoint first (returns calculated discountAmount)
    const validated = await validatePromotion(couponCode.trim(), subtotal);
    if (validated) {
      setCouponDiscount(validated.discountAmount);
      setCouponApplied(validated.code || couponCode.trim());
      return;
    }

    // Fallback to old getPromotionByCode + client-side calculation
    const promo = await getPromotionByCode(couponCode.trim());
    if (promo) {
      const disc = calculatePromotionDiscount(promo, subtotal);
      setCouponDiscount(disc);
      setCouponApplied(promo.code || couponCode.trim());
    } else {
      setCouponError('Mã giảm giá không hợp lệ');
      setCouponDiscount(0);
      setCouponApplied('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.customerName.trim()) {
      setSubmitError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!form.customerPhone.trim()) {
      setSubmitError('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!form.addressLine.trim() || !form.province.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ địa chỉ và tỉnh/thành phố.');
      return;
    }
    if (items.length === 0) {
      setSubmitError('Giỏ hàng trống.');
      return;
    }
    const phoneClean = form.customerPhone.replace(/\s/g, '');
    const phoneRegex = /^(0[0-9]{9,10})$/;
    if (!phoneRegex.test(phoneClean)) {
      setSubmitError('Số điện thoại không hợp lệ. Vui lòng nhập lại (09x / 0[1-9]xxxxxxxx).');
      return;
    }

    setSubmitting(true);

    try {
      const order = await createOrder({
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        customer_email: form.customerEmail || undefined,
        shipping_address_text: shippingAddressText,
        delivery_slot: form.deliverySlot,
        payment_method: form.paymentMethod,
        shipping_fee: shippingFee,
        coupon_code: couponApplied || undefined,
        discount_amount: couponDiscount || undefined,
        note: form.customerNote || undefined,
        items: items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          selected_unit: item.selectedUnit,
          price_at_time: item.priceAtTime,
          processing_service_id: item.processingService?.id || null,
          product_name: item.product.name,
          image_url: (() => {
            const first = item.product.images?.[0];
            if (!first) return undefined;
            return typeof first === 'string' ? first : first.imageUrl;
          })(),
        })),
      });
      clearCart();
      router.push(`/order-success?orderCode=${encodeURIComponent(order.orderCode)}`);
    } catch (err: any) {
      setSubmitError(err?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    
      <main className="hs-container checkout-page">
        <div className="hs-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link href="/cart">Giỏ hàng</Link>
          <ChevronRight size={14} />
          <span>Thanh toán</span>
        </div>
        <section className="hs-page-toolbar">
          <div>
            <h1>Thanh toán đơn hàng</h1>
            <p>Điền thông tin giao hàng để Hải Sản Biển Xanh chuẩn bị đơn cho bạn</p>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="empty-state">
            <h2>Giỏ hàng trống</h2>
            <p>Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
            <Link
              href="/products"
              className="primary-cta"
              style={{ display: 'inline-flex' }}
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkout-layout">
            {/* Left column: Form */}
            <section className="checkout-form">
              <h2 className="section-title">
                <User size={18} /> Thông tin giao hàng
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={14} /> Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => update('customerName', e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Phone size={14} /> Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.customerPhone}
                    onChange={(e) => update('customerPhone', e.target.value)}
                    placeholder="0901 234 567"
                  />
                </div>
                <div className="form-group full">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => update('customerEmail', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group full">
                  <label>
                    <MapPin size={14} /> Địa chỉ (số nhà, đường, phường/xã) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.addressLine}
                    onChange={(e) => update('addressLine', e.target.value)}
                    placeholder="Số nhà, đường, phường/xã"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <MapPin size={14} /> Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.province}
                    onChange={(e) => update('province', e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                  />
                </div>
                <div className="form-group">
                  <label>Quận/Huyện</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => update('district', e.target.value)}
                    placeholder="Quận 1"
                  />
                </div>
              </div>

              <h2 className="section-title" style={{ marginTop: 32 }}>
                <Clock size={18} /> Khung giờ giao hàng
              </h2>
              <div className="delivery-slots">
                {DELIVERY_SLOTS.map((slot) => (
                  <label
                    key={slot.value}
                    className={`delivery-slot ${
                      form.deliverySlot === slot.value ? 'active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.value}
                      checked={form.deliverySlot === slot.value}
                      onChange={(e) => update('deliverySlot', e.target.value)}
                    />
                    <div>
                      <strong>{slot.label}</strong>
                      <small>{slot.time}</small>
                    </div>
                  </label>
                ))}
              </div>

              <div className="form-group full" style={{ marginTop: 24 }}>
                <label>Ghi chú đơn hàng</label>
                <textarea
                  value={form.customerNote}
                  onChange={(e) => update('customerNote', e.target.value)}
                  placeholder="Ví dụ: Gọi trước khi giao, giao cẩn thận..."
                  rows={3}
                />
              </div>

              <h2 className="section-title" style={{ marginTop: 32 }}>
                Phương thức thanh toán
              </h2>
              <div className="payment-methods">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`payment-option ${
                      form.paymentMethod === m.value ? 'active' : ''
                    } ${m.disabled ? 'payment-option--disabled' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={form.paymentMethod === m.value}
                      onChange={(e) => {
                        if (!m.disabled) update('paymentMethod', e.target.value);
                      }}
                      disabled={m.disabled}
                    />
                    <span className="payment-icon">{m.icon}</span>
                    <span>{m.label}</span>
                    {m.badge && <span className="payment-badge">{m.badge}</span>}
                  </label>
                ))}
              </div>
            </section>

            {/* Right column: Order summary */}
            <aside className="checkout-summary">
              <h2 className="section-title">Đơn hàng của bạn</h2>

              <div className="order-items">
                {items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <img
                      src={
                        (() => {
                          const first = item.product.images?.[0];
                          if (!first) return img('prod-tom.jpg');
                          return typeof first === 'string' ? first : first.imageUrl;
                        })()
                      }
                      alt={item.product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=200';
                      }}
                    />
                    <div>
                      <b>{item.product.name}</b>
                      {item.variant && <small>{item.variant.name}</small>}
                      <p>
                        x{item.quantity} {money(item.priceAtTime)}
                      </p>
                    </div>
                    <strong>
                      {money(item.priceAtTime * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="coupon-box">
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="coupon-btn"
                >
                  Áp dụng
                </button>
              </div>
              {couponApplied && (
                <p className="coupon-success">
                  Đã áp dụng: <b>{couponApplied}</b> (-{money(couponDiscount)})
                </p>
              )}
              {couponError && <p className="coupon-error">{couponError}</p>}

              <div className="summary-lines">
                <div>
                  <span>Tạm tính</span>
                  <b>{money(subtotal)}</b>
                </div>
                {couponDiscount > 0 && (
                  <div>
                    <span>Giảm giá</span>
                    <b style={{ color: '#10b981' }}>
                      -{money(couponDiscount)}
                    </b>
                  </div>
                )}
                <div>
                  <span>Phí giao hàng</span>
                  <b>
                    {shippingLoading ? (
                      <span style={{ color: '#64748b' }}>Đang tính...</span>
                    ) : shippingFee === 0 ? (
                      <span style={{ color: '#10b981' }}>Miễn phí</span>
                    ) : (
                      money(shippingFee)
                    )}
                  </b>
                </div>
                <div className="total">
                  <span>Tổng tiền</span>
                  <b>{money(total > 0 ? total : 0)}</b>
                </div>
              </div>

              {submitError && (
                <div className="submit-error">{submitError}</div>
              )}

              <button
                type="submit"
                className="buy-cta checkout-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
              </button>

              <div className="checkout-trust">
                <p>
                  <ShieldCheck size={16} /> Bảo mật thông tin
                </p>
                <p>
                  <Truck size={16} /> Giao hàng đúng hẹn
                </p>
              </div>
            </aside>
          </form>
        )}
      </main>
    
  );
}
