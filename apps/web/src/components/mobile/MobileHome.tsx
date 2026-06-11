'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingCart, Phone, User,
  Leaf, Truck, ShieldCheck, Star, ChevronRight,
  Package, Sparkles, Percent, ArrowRight,
} from 'lucide-react';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { formatPhone } from '@/lib/phone';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export type MobileCategory = { id: string; name: string; imageUrl?: string; slug: string };
export type MobileProduct = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg?: number; soldCount?: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};
export type MobileBanner = {
  id: string; title: string; subtitle?: string;
  imageUrl?: string; linkUrl?: string; link?: string;
};

interface MobileHomeProps {
  categories: MobileCategory[];
  products: MobileProduct[];
  banners: MobileBanner[];
  heroBanners?: MobileBanner[];
  bestSellerProducts: MobileProduct[];
}

const HERO_IMG = 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80';
const CAT_IMG = 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&q=80';
const PROD_IMG = 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&q=80';

const BADGE: Record<string, string> = { BAN_CHAY: 'Bán chạy', UU_DAI: 'Ưu đãi', TUOI_NGON: 'Tươi ngon', MOI: 'Mới' };

const CATS: Array<{ id: string; name: string; slug: string; imageUrl?: string }> = [
  { id: 'tom', name: 'Tôm', slug: 'tom' },
  { id: 'cua-ghe', name: 'Cua - Ghẹ', slug: 'cua-ghe' },
  { id: 'ca', name: 'Cá', slug: 'ca' },
  { id: 'muc', name: 'Mực', slug: 'muc' },
  { id: 'oc-so', name: 'Ốc - Sò', slug: 'oc-so' },
  { id: 'combo', name: 'Combo', slug: 'combo' },
  { id: 'so-che', name: 'Sơ chế', slug: 'hai-san-so-che' },
];

const COMBO_CARDS = [
  { title: 'Combo Gia Đình', sub: 'Tiết kiệm đến 20%', href: '/products?category=combo', icon: Package, color: '#ff7a18' },
  { title: 'Hải Sản Sơ Chế', sub: 'Làm sạch - Tiện lợi', href: '/products?tag=hai-san-so-che', icon: Sparkles, color: '#0066cc' },
];

/* ─────────────────────────────────────────
   MOBILE HOME
   ───────────────────────────────────────── */
export default function MobileHome({ categories, bestSellerProducts }: MobileHomeProps) {
  const { getItemCount } = useCart();
  const { settings } = useStoreSettings();
  const phone = settings?.phone || settings?.hotline || '0901 234 567';
  const formattedPhone = formatPhone(phone);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const displayCats = categories.length > 0 ? categories.slice(0, 7) : CATS;

  return (
    <div className="mob-home">
      {/* ── HEADER ── */}
      <header className="mob-hdr">
        <div className="mob-hdr-top">
          <Link href="/" className="mob-hdr-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#0ea5e9" opacity="0.2"/>
              <path d="M6 22c3-4 6-6 10-6s5 2 5 2 3-2 5-2 7 2 10 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M16 8l-2.5 5h5L16 8z" fill="#fff"/>
            </svg>
            <div className="mob-hdr-logo-text">
              <span className="mob-hdr-brand">Hải Sản Biển Xanh</span>
              <span className="mob-hdr-tagline">Tươi sống mỗi ngày</span>
            </div>
          </Link>
          <div className="mob-hdr-actions">
            <Link href="/cart" className="mob-hdr-icon">
              <ShoppingCart size={22} />
              {getItemCount() > 0 && <span className="mob-hdr-badge">{getItemCount()}</span>}
            </Link>
            <Link href="/account" className="mob-hdr-icon">
              <User size={22} />
            </Link>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <form className="mob-search" onSubmit={handleSearch}>
          <div className="mob-search-inner">
            <Search size={17} className="mob-search-icon" />
            <input
              type="search"
              placeholder="Tìm tôm, cua, cá, mực..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mob-search-input"
            />
          </div>
          <button type="submit" className="mob-search-btn">Tìm</button>
        </form>
      </header>

      {/* ── HERO ── */}
      <section className="mob-hero" data-section="mobile-hero">
        <div className="mob-hero-card">
          <div className="mob-hero-content">
            <span className="mob-hero-brand">HẢI SẢN BIỂN XANH</span>
            <h1 className="mob-hero-title">TƯƠI SỐNG</h1>
            <p className="mob-hero-sub">Giao nhanh trong ngày</p>
            <div className="mob-hero-chips">
              <span className="mob-hero-chip"><Leaf size={12} /> Tươi sống</span>
              <span className="mob-hero-chip"><Truck size={12} /> Giao 2h</span>
              <span className="mob-hero-chip"><ShieldCheck size={12} /> Đổi trả</span>
            </div>
            <div className="mob-hero-actions">
              <Link href="/products" className="mob-btn-order">Đặt hàng ngay</Link>
              <Link href={`tel:${phone.replace(/\s/g, '')}`} className="mob-btn-call">
                <Phone size={14} /> Gọi ngay
              </Link>
            </div>
          </div>
          <div className="mob-hero-img-wrap">
            <img src={HERO_IMG} alt="Hải sản tươi sống" className="mob-hero-img" />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="mob-section">
        <div className="mob-section-head">
          <h2 className="mob-section-title">Danh mục</h2>
          <Link href="/products" className="mob-section-link">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
        <div className="mob-cats-track">
          {displayCats.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="mob-cat-item">
              <div className="mob-cat-img-wrap">
                <img src={cat.imageUrl || CAT_IMG} alt={cat.name} className="mob-cat-img" />
              </div>
              <span className="mob-cat-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <Link href="/products?promotion=true" className="mob-promo-banner">
        <div className="mob-promo-icon">
          <Percent size={18} />
        </div>
        <div className="mob-promo-content">
          <span className="mob-promo-title">MUA CÀNG NHIỀU - ƯU ĐÃI CÀNG LỚN</span>
          <span className="mob-promo-sub">Freeship đơn từ 500k tại TP.HCM</span>
        </div>
        <ChevronRight size={18} className="mob-promo-arrow" />
      </Link>

      {/* ── COMBO CARDS ── */}
      <section className="mob-section">
        <div className="mob-combo-grid">
          {COMBO_CARDS.map((card) => (
            <Link key={card.title} href={card.href} className="mob-combo-card">
              <div className="mob-combo-icon" style={{ color: card.color }}>
                <card.icon size={28} strokeWidth={1.8} />
              </div>
              <div className="mob-combo-text">
                <span className="mob-combo-title">{card.title}</span>
                <span className="mob-combo-sub">{card.sub}</span>
              </div>
              <ArrowRight size={16} className="mob-combo-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      {bestSellerProducts.length > 0 && (
        <section className="mob-section" data-section="mobile-products">
          <div className="mob-section-head">
            <h2 className="mob-section-title">
              <span className="mob-section-icon">🔥</span> Sản phẩm bán chạy
            </h2>
            <Link href="/products" className="mob-section-link">
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mob-prod-grid">
            {bestSellerProducts.slice(0, 6).map(product => (
              <MobileProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── TRUST BADGES ── */}
      <section className="mob-trust">
        <div className="mob-trust-grid">
          <div className="mob-trust-item">
            <div className="mob-trust-icon"><Leaf size={22} /></div>
            <span>100% Tươi sống</span>
          </div>
          <div className="mob-trust-item">
            <div className="mob-trust-icon"><Truck size={22} /></div>
            <span>Giao nhanh 2h</span>
          </div>
          <div className="mob-trust-item">
            <div className="mob-trust-icon"><ShieldCheck size={22} /></div>
            <span>Thanh toán khi nhận</span>
          </div>
          <div className="mob-trust-item">
            <div className="mob-trust-icon"><Phone size={22} /></div>
            <span>Hỗ trợ 24/7</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────
   MOBILE PRODUCT CARD
   ───────────────────────────────────────── */
function MobileProductCard({ product }: { product: MobileProduct }) {
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

  const badge = product.badge ? BADGE[product.badge] || product.badge : null;

  return (
    <Link href={`/products/${product.slug}`} className="mob-prod-card">
      <div className="mob-prod-img-wrap">
        <img
          src={product.images?.[0]?.imageUrl || PROD_IMG}
          alt={product.name}
          className="mob-prod-img"
        />
        {badge && <span className="mob-prod-badge">{badge}</span>}
      </div>
      <div className="mob-prod-info">
        <span className="mob-prod-name">{product.name}</span>
        {(product.ratingAvg ?? 0) > 0 && (
          <span className="mob-prod-rating">
            <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
            {Number(product.ratingAvg).toFixed(1)}
            {product.soldCount && <span className="mob-prod-sold"> · {product.soldCount}+ đã bán</span>}
          </span>
        )}
        <div className="mob-prod-bottom">
          <div className="mob-prod-price">
            <b>{money(Number(product.basePrice))}</b>
            <small>/{product.unit}</small>
          </div>
          <button
            className={`mob-prod-add ${adding ? 'adding' : ''}`}
            onClick={handleAdd}
            disabled={adding}
            aria-label={`Thêm ${product.name}`}
          >
            {adding ? '✓' : '+'}
          </button>
        </div>
      </div>
    </Link>
  );
}
