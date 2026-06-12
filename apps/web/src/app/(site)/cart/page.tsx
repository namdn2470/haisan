'use client';

import Link from 'next/link';
import {
  Trash2, Minus, Plus,
  Truck, CheckCircle2, ShoppingCart, ArrowLeft,
} from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';


export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getShippingFee,
    getTotal,
    isLoading,
  } = useCart();

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const total = getTotal();
  const safeItems = Array.isArray(items) ? items : [];

  if (isLoading) {
    return (
      <main className="hs-container cart-page">
        <div className="loading-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: 100 }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="hs-container cart-page">
      <div className="hs-breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <span>Giỏ hàng</span>
      </div>

      <section className="hs-page-toolbar">
        <div>
          <h1>Giỏ hàng</h1>
          <p>Kiểm tra sản phẩm trước khi đặt hải sản tươi giao trong ngày</p>
        </div>
      </section>

      {safeItems.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={64} strokeWidth={1} color="#cbd5e1" />
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy thêm sản phẩm hải sản tươi ngon vào giỏ hàng</p>
          <Link href="/products" className="primary-cta" style={{ display: 'inline-flex' }}>
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items list */}
          <section className="cart-list">
            <div className="cart-list-header">
              <span>Giỏ hàng ({safeItems.length} sản phẩm)</span>
              <Link href="/products" className="continue-link">
                <ArrowLeft size={14} /> Tiếp tục mua
              </Link>
            </div>

            {safeItems.map((item) => {
              const imageUrl = (() => {
                const first = item.product.images?.[0];
                if (!first) return img('prod-tom.jpg');
                return typeof first === 'string' ? first : first.imageUrl;
              })();

              return (
                <article className="crt-item" key={item.id}>
                  <div className="crt-item-top">
                    <div className="crt-item-img">
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                    </div>

                    <div className="crt-item-body">
                      <div className="crt-item-header">
                        <h3 className="crt-item-name">{item.product.name}</h3>
                        <button
                          className="crt-item-del"
                          onClick={() => removeItem(item.id)}
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {item.variant && (
                        <p className="crt-item-variant">Quy cách: {item.variant.name}</p>
                      )}
                      {item.processingService && (
                        <p className="crt-item-variant">Dịch vụ: {item.processingService.name}</p>
                      )}

                      <p className="crt-item-price">
                        {money(item.priceAtTime)}/{item.selectedUnit}
                      </p>

                      <div className="crt-item-footer">
                        <div className="crt-qty">
                          <button
                            className="crt-qty-dec"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Giảm"
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            className="crt-qty-inc"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Tăng"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <strong className="crt-item-total">
                          {money(item.priceAtTime * item.quantity)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Order summary */}
          <aside className="summary">
            <h2>Tóm tắt đơn hàng</h2>

            <div className="summary-row">
              <span>Tạm tính ({safeItems.length} sản phẩm)</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="summary-row">
              <span>Phí giao hàng</span>
              <b>
                {shippingFee === 0 ? (
                  <span style={{ color: '#10b981' }}>Miễn phí</span>
                ) : (
                  money(shippingFee)
                )}
              </b>
            </div>
            {shippingFee > 0 && (
              <p className="free-shipping-hint">
                Mua thêm {money(500000 - subtotal)} để miễn phí giao
              </p>
            )}
            <div className="total summary-row">
              <span>Tổng cộng</span>
              <b>{money(total)}</b>
            </div>

            <Link
              href="/checkout"
              className="buy-cta"
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
                padding: '14px',
                textDecoration: 'none',
              }}
            >
              Tiến hành đặt hàng
            </Link>

            <div className="summary-benefits">
              <p><Truck size={16} /> Miễn phí giao đơn từ 500k</p>
              <p><CheckCircle2 size={16} /> Cam kết giao đúng giờ</p>
              <p><CheckCircle2 size={16} /> Đổi trả nếu không tươi</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
