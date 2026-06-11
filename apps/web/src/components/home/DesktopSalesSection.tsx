'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck, ChevronRight, CheckCircle2, Percent,
  ShoppingCart, Star, Package, MapPin, Zap,
} from 'lucide-react';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';
import { img } from '@/lib/api';
import type { ShippingZone } from '@/services/productService';

/* ─────────────────────────────────────────
   TYPES
   ───────────────────────────────────────── */
export type HomeProduct = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg?: number; soldCount?: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};

export type DesktopSalesSectionProps = {
  shippingZones?: ShippingZone[];
  bestSellerProducts?: HomeProduct[];
  comboProducts?: HomeProduct[];
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy', UU_DAI: 'Ưu đãi', TUOI_NGON: 'Tươi ngon', MOI: 'Mới',
};

const PROD_IMG = 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&q=80';
const COMBO_FALLBACK = 'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=400';

/* ─────────────────────────────────────────
   SECTION ENTRY
   ───────────────────────────────────────── */
export function DesktopSalesSection({
  shippingZones = [],
  bestSellerProducts = [],
  comboProducts = [],
}: DesktopSalesSectionProps) {
  return (
    <section className="dss-wrap">
      <div className="dss-container">
        {/* 2-column grid: 9fr main | 3fr sidebar */}
        <div className="dss-grid">
          {/* LEFT — Best Sellers (3×2 grid) */}
          <div className="dss-col dss-col-main">
            <BestSellerCol products={bestSellerProducts} />
          </div>

          {/* RIGHT — Sidebar: Delivery + Combo stacked */}
          <div className="dss-col dss-col-sidebar">
            <DeliveryCard zones={shippingZones} />
            <ComboCard products={comboProducts} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   DELIVERY CARD (LEFT)
   ───────────────────────────────────────── */
function DeliveryCard({ zones }: { zones: ShippingZone[] }) {
  const activeZones = zones.filter(z => z.isActive);
  const primaryZone = activeZones[0];
  const subtitle = primaryZone?.name || 'Khu vực TP.HCM & lân cận';
  const freeFrom = primaryZone ? Number(primaryZone.freeFromAmount) : 500000;

  return (
    <div className="dss-delivery-card">
      {/* Header */}
      <div className="dss-delivery-top">
        <div className="dss-delivery-icon">
          <Truck size={22} />
        </div>
        <div className="dss-delivery-title-group">
          <h3 className="dss-delivery-title">Giao nhanh trong 2 giờ</h3>
          <p className="dss-delivery-sub">{subtitle}</p>
        </div>
      </div>

      {/* Zone chips */}
      {activeZones.length > 0 && (
        <div className="dss-zone-chips">
          {activeZones.slice(0, 4).map(z => (
            <span key={z.id} className="dss-zone-chip">
              <MapPin size={9} />{z.name}
            </span>
          ))}
        </div>
      )}

      {/* Benefits */}
      <div className="dss-benefits">
        <div className="dss-benefit">
          <CheckCircle2 size={13} />
          <span>Giao trước 22:00 mỗi ngày</span>
        </div>
        <div className="dss-benefit">
          <CheckCircle2 size={13} />
          <span>Đổi trả dễ dàng trong 24h</span>
        </div>
        <div className="dss-benefit dss-benefit-free">
          <Percent size={13} />
          <span>Miễn phí vận chuyển từ {money(freeFrom)}</span>
        </div>
      </div>

      {/* CTA */}
      <Link href="/products" className="dss-delivery-cta">
        Đặt hàng ngay <ChevronRight size={14} />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────
   BEST SELLER COL (CENTER)
   ───────────────────────────────────────── */
function BestSellerCol({ products }: { products: HomeProduct[] }) {
  const items = products.slice(0, 6);

  return (
    <div className="dss-bestseller">
      {/* Header */}
      <div className="dss-col-header">
        <h2 className="dss-col-title">
          <span className="dss-col-title-icon">🔥</span>
          Sản phẩm bán chạy
        </h2>
        <Link href="/products" className="dss-col-link">
          Xem tất cả <ChevronRight size={13} />
        </Link>
      </div>

      {/* Product grid 2×2 */}
      {items.length > 0 ? (
        <div className="dss-bestseller-grid">
          {items.map(p => (
            <CompactProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="dss-empty">Đang cập nhật sản phẩm...</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   COMBO CARD (RIGHT)
   ───────────────────────────────────────── */
function ComboCard({ products }: { products: HomeProduct[] }) {
  const thumbs = products.slice(0, 3);
  const minPrice = products.length > 0
    ? Math.min(...products.map(p => Number(p.basePrice)))
    : 0;
  const comboCount = products.length || 4;
  const displayMinPrice = minPrice > 0 ? minPrice : 799000;

  return (
    <div className="dss-combo-card">
      {/* Glow effect */}
      <div className="dss-combo-glow" />

      <div className="dss-combo-body">
        {/* Badge */}
        <span className="dss-combo-badge">
          <Package size={9} /> Tiết kiệm hơn
        </span>

        {/* Title */}
        <h3 className="dss-combo-title">Combo Gia Đình</h3>
        <p className="dss-combo-sub">Ngon hơn — Đủ món — Tiện lợi</p>

        {/* Discount pill */}
        <span className="dss-combo-discount">Giảm đến 20%</span>

        {/* Stats */}
        <div className="dss-combo-stats">
          <span className="dss-combo-stat">
            <Package size={11} />
            {comboCount} combo
          </span>
          <span className="dss-combo-stat">
            Từ {money(displayMinPrice)}
          </span>
        </div>

        {/* CTA */}
        <Link href="/products?category=combo" className="dss-combo-cta">
          Xem các combo <ChevronRight size={13} />
        </Link>
      </div>

      {/* Thumbnails */}
      {thumbs.length > 0 ? (
        <div className="dss-combo-thumbs">
          {thumbs.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className={`dss-combo-thumb dss-combo-thumb-${i}`}
            >
              <img
                src={p.images?.[0]?.imageUrl || COMBO_FALLBACK}
                alt={p.name}
                onError={e => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = COMBO_FALLBACK; }
                }}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="dss-combo-thumbs">
          <div className="dss-combo-thumb dss-combo-thumb-0">
            <img src={COMBO_FALLBACK} alt="Combo hải sản" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   COMPACT PRODUCT CARD
   ───────────────────────────────────────── */
function CompactProductCard({ product }: { product: HomeProduct }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
        selectedUnit: product.unit,
        priceAtTime: Number(product.basePrice),
        product: {
          id: product.id, name: product.name, slug: product.slug,
          basePrice: Number(product.basePrice), unit: product.unit,
          images: product.images || [],
        },
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="dss-prod-card">
      {/* Image */}
      <div className="dss-prod-img">
        <img
          src={product.images?.[0]?.imageUrl || PROD_IMG}
          alt={product.name}
          onError={e => {
            const t = e.currentTarget as HTMLImageElement;
            if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = PROD_IMG; }
          }}
        />
        {product.badge && (
          <span className="dss-prod-badge">{BADGE_MAP[product.badge]}</span>
        )}
      </div>

      {/* Info */}
      <div className="dss-prod-info">
        <h4 className="dss-prod-name">{product.name}</h4>

        {(product.ratingAvg ?? 0) > 0 && (
          <div className="dss-prod-rating">
            <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
            <span>{Number(product.ratingAvg).toFixed(1)}</span>
          </div>
        )}

        <div className="dss-prod-bottom">
          <div className="dss-prod-price">
            <strong>{money(Number(product.basePrice))}</strong>
            <small>/{product.unit}</small>
            {product.oldPrice && (
              <del className="dss-prod-old">{money(Number(product.oldPrice))}</del>
            )}
          </div>
          <button
            className={`dss-prod-add ${adding ? 'adding' : ''}`}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? '✓' : '+'}
          </button>
        </div>
      </div>
    </Link>
  );
}
