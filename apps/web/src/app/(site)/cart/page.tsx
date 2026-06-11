'use client';

import Link from 'next/link';
import {
  Trash2,
  Minus,
  Plus,
  Truck,
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
} from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';


export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getShippingFee, getTotal, isLoading } =
    useCart();

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const total = getTotal();

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
        {items.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={64} strokeWidth={1} color="#cbd5e1" />
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy thêm sản phẩm hải sản tươi ngon vào giỏ hàng</p>
            <Link
              href="/products"
              className="primary-cta"
              style={{ display: 'inline-flex' }}
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-list">
              <div className="cart-list-header">
                <span>Giỏ hàng ({items.length} sản phẩm)</span>
                <Link href="/products" className="continue-link">
                  <ArrowLeft size={14} /> Tiếp tục mua sắm
                </Link>
              </div>

              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
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
                          'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400';
                      }}
                    />
                  </div>
                  <div className="cart-item-info">
                    <h3>{item.product.name}</h3>
                    {item.variant && (
                      <p className="cart-item-variant">
                        Quy cách: {item.variant.name}
                      </p>
                    )}
                    {item.processingService && (
                      <p className="cart-item-service">
                        Dịch vụ: {item.processingService.name}
                      </p>
                    )}
                    <b className="cart-item-price">
                      {money(item.priceAtTime)}/{item.selectedUnit}
                    </b>
                  </div>
                  <div className="qty">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <strong className="cart-item-total">
                    {money(item.priceAtTime * item.quantity)}
                  </strong>
                  <button
                    className="trash"
                    onClick={() => removeItem(item.id)}
                    aria-label="Xóa sản phẩm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </section>

            <aside className="summary">
              <h2>Tóm tắt đơn hàng</h2>
              <div className="summary-row">
                <span>Tạm tính ({items.length} sản phẩm)</span>
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
                TIẾN HÀNH ĐẶT HÀNG
              </Link>
              <div className="summary-benefits">
                <p>
                  <Truck size={16} /> Miễn phí giao đơn từ 500k
                </p>
                <p>
                  <CheckCircle2 size={16} /> Cam kết giao đúng giờ
                </p>
                <p>
                  <CheckCircle2 size={16} /> Đổi trả nếu không tươi
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    
  );
}
