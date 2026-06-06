'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, Truck, CheckCircle2, ShoppingCart, ArrowLeft, Search } from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';

type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  selectedUnit: string;
  priceAtTime: number;
  note?: string;
  product: { id: string; name: string; slug: string; basePrice: number; unit: string; images?: { imageUrl: string }[] };
  variant?: { id: string; name: string; price: number };
  processingService?: { id: string; name: string; price: number };
};

type CartData = {
  id: string;
  items: CartItem[];
};

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: CartData }>('/api/carts').then(r => {
      setCart(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const items = cart?.items || [];
  const subtotal = useMemo(() => items.reduce((s, i) => s + Number(i.priceAtTime) * Number(i.quantity), 0), [items]);

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    try {
      await api(`/api/carts/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
      setCart(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? { ...i, quantity: qty } : i),
      } : prev);
    } catch {}
  };

  const removeItem = async (itemId: string) => {
    try {
      await api(`/api/carts/items/${itemId}`, { method: 'DELETE' });
      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
      } : prev);
    } catch {}
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand"><img src={img('logo.jpg')} alt="Hải Sản Biển Xanh" /></Link>
          <div className="searchbox" style={{ flex: 1 }}><Search size={20} /><input placeholder="Tìm kiếm hải sản..." readOnly /></div>
          <Link href="/products" className="header-action"><ArrowLeft size={20} /><span>Tiếp tục mua sắm</span></Link>
        </div>
      </header>

      <nav className="nav">
        <div className="container nav-inner">
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Giỏ hàng ({items.length} sản phẩm)</h1>
        </div>
      </nav>

      <main className="container cart-page">
        {loading ? (
          <div className="loading-grid">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 100 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={64} strokeWidth={1} color="#cbd5e1" />
            <h2>Giỏ hàng trống</h2>
            <p>Hãy thêm sản phẩm hải sản tươi ngon vào giỏ hàng</p>
            <Link href="/products" className="primary-cta" style={{ display: 'inline-flex' }}>Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-list">
              {items.map(item => (
                <div className="cart-item" key={item.id}>
                  <img src={item.product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={item.product.name} />
                  <div>
                    <h3>{item.product.name}</h3>
                    {item.variant && <p>Size: {item.variant.name}</p>}
                    {item.processingService && <p>Dịch vụ: {item.processingService.name}</p>}
                    <b>{money(Number(item.priceAtTime))}/{item.selectedUnit}</b>
                  </div>
                  <div className="qty">
                    <button onClick={() => updateQty(item.id, Number(item.quantity) - 1)}><Minus size={15} /></button>
                    <span>{Number(item.quantity)}</span>
                    <button onClick={() => updateQty(item.id, Number(item.quantity) + 1)}><Plus size={15} /></button>
                  </div>
                  <strong>{money(Number(item.priceAtTime) * Number(item.quantity))}</strong>
                  <button className="trash" onClick={() => removeItem(item.id)}><Trash2 size={20} /></button>
                </div>
              ))}
            </section>
            <aside className="summary">
              <h2>Tóm tắt đơn hàng</h2>
              <div><span>Tạm tính ({items.length} sản phẩm)</span><b>{money(subtotal)}</b></div>
              <div><span>Phí giao hàng</span><b>{subtotal >= 500000 ? <span className="green">Miễn phí</span> : money(30000)}</b></div>
              <div className="total"><span>Tổng tiền</span><b>{money(subtotal + (subtotal >= 500000 ? 0 : 30000))}</b></div>
              <Link href="/checkout" className="buy-cta" style={{ marginTop: 16 }}>TIẾN HÀNH ĐẶT HÀNG</Link>
              <div className="summary-benefits">
                <p><Truck size={16} /> Miễn phí giao đơn từ 500k</p>
                <p><CheckCircle2 size={16} /> Cam kết giao đúng giờ</p>
                <p><CheckCircle2 size={16} /> Đổi trả nếu không tươi</p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
