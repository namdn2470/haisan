'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck, ShieldCheck, Scale, ChevronRight,
  ShoppingCart, Phone, Clock, Star, Package,
  Leaf, Heart, RotateCcw, MapPin, Zap,
  CheckCircle2, Percent, Tag,
} from 'lucide-react';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';
import { img, resolveUploadUrl } from '@/lib/api';
import { formatPhone } from '@/lib/phone';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import type { ShippingZone } from '@/services/productService';
import { DesktopSalesSection } from './DesktopSalesSection';

export type HomeCategory = { id: string; name: string; imageUrl?: string; slug: string };
export type HomeProduct = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg?: number; soldCount?: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};
export type HomeBanner = {
  id: string; title: string; subtitle?: string;
  imageUrl?: string; linkUrl?: string; link?: string;
};
export type HomeVisibility = {
  categories: boolean; promo: boolean; newArrival: boolean; featured: boolean; bestSeller: boolean;
};
export type HomeSectionPublic = {
  slug: string; title: string; subtitle?: string; description?: string;
  ctaText?: string; ctaUrl?: string; enabled: boolean; maxItems: number;
  products: HomeProduct[];
};

type HomeClientProps = {
  categories: HomeCategory[]; products: HomeProduct[];
  banners: HomeBanner[]; heroBanners?: HomeBanner[];
  featuredProducts: HomeProduct[]; bestSellerProducts: HomeProduct[];
  visible: HomeVisibility; homeSections?: HomeSectionPublic[];
  shippingZones?: ShippingZone[];
  comboProducts?: HomeProduct[];
};

const DEFAULT_VISIBLE: HomeVisibility = {
  categories: true, promo: true, newArrival: true, featured: true, bestSeller: true,
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy', UU_DAI: 'Ưu đãi', TUOI_NGON: 'Tươi ngon', MOI: 'Mới',
};

const DEFAULT_CATS: HomeCategory[] = [
  { id: 'tom', name: 'Tôm', slug: 'tom' },
  { id: 'cua-ghe', name: 'Cua - Ghẹ', slug: 'cua-ghe' },
  { id: 'ca', name: 'Cá', slug: 'ca' },
  { id: 'muc', name: 'Mực', slug: 'muc' },
  { id: 'oc-so', name: 'Ốc - Sò', slug: 'oc-so' },
  { id: 'hau', name: 'Hàu - Sò điệp', slug: 'hau' },
  { id: 'combo', name: 'Combo hot', slug: 'combo' },
  { id: 'so-che', name: 'Hải sản chế biến', slug: 'hai-san-so-che' },
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80';
const CAT_IMG = 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&q=80';
const PROD_IMG = 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&q=80';

export default function HomeClient({ categories, products, heroBanners = [], featuredProducts, bestSellerProducts, visible = DEFAULT_VISIBLE, homeSections = [], shippingZones = [], comboProducts = [] }: HomeClientProps) {
  const displayCats = categories.length > 0 ? categories : DEFAULT_CATS;
  const todaySection = homeSections.find(s => s.slug === 'today-suggestion');
  const promoSection = homeSections.find(s => s.slug === 'promo-today');

  return (
    <div className="hs-home-desktop">
      {/* HERO BANNER — đầu trang, ngay dưới navigation */}
      <DesktopHero heroBanners={heroBanners} promoProducts={promoSection?.products?.slice(0, 2) || products.slice(0, 2)} />

      {/* CATEGORY STRIP — sau hero */}
      {visible.categories && <DesktopCategories categories={displayCats} />}

      {/* DELIVERY + BEST SELLERS + COMBO — desktop only */}
      <div className="hidden lg:block">
        <DesktopSalesSection
          shippingZones={shippingZones}
          bestSellerProducts={bestSellerProducts}
          comboProducts={comboProducts}
        />
      </div>

      {/* FEATURED PRODUCTS */}
      {visible.featured && featuredProducts.length > 0 && (
        <DesktopFeaturedSection products={featuredProducts} />
      )}

      {/* TRUST BADGES */}
      <DesktopTrustBadges />

      {/* BUY TOGETHER */}
      {visible.newArrival && products.length > 0 && (
        <DesktopBuyTogether products={products} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   DESKTOP HERO
   ───────────────────────────────────────── */
function DesktopHero({ heroBanners, promoProducts }: { heroBanners: HomeBanner[]; promoProducts: HomeProduct[] }) {
  const { settings } = useStoreSettings();
  const [activeIdx, setActiveIdx] = useState(0);
  const phone = settings?.phone || settings?.hotline || '0901 234 567';
  const formattedPhone = formatPhone(phone);
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 23, s: 47 });

  const hero = heroBanners[activeIdx] || heroBanners[0];
  const imgSrc = resolveUploadUrl(hero?.imageUrl) || FALLBACK_IMG;

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % heroBanners.length), 5000);
    return () => clearInterval(t);
  }, [heroBanners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hs-hero-section">
      <div className="hs-container">
        <div className="hs-hero-grid">
          {/* LEFT: Text Content */}
          <div className="hs-hero-content">
            <span className="hs-hero-badge">100% Hải sản tươi sống</span>
            <h1 className="hs-hero-title">Hải Sản <span className="hs-hero-highlight">Tươi Ngon</span></h1>
            <p className="hs-hero-subtitle">Giao nhanh trong ngày — Giao tận nơi</p>

            {/* Trust Pills */}
            <div className="hs-hero-trust">
              <div className="hs-hero-trust-item"><Leaf size={16} /><span>Tươi sống</span></div>
              <div className="hs-hero-trust-item"><Truck size={16} /><span>Giao 2h</span></div>
              <div className="hs-hero-trust-item"><ShieldCheck size={16} /><span>Đổi trả</span></div>
              <div className="hs-hero-trust-item"><Scale size={16} /><span>Giá rõ</span></div>
            </div>

            {/* CTAs */}
            <div className="hs-hero-ctas">
              <Link href="/products" className="hs-hero-cta-primary">
                <ShoppingCart size={18} /> MUA NGAY
              </Link>
              <Link href="/products?category=combo" className="hs-hero-cta-secondary">
                Xem Combo
              </Link>
              <Link href={`tel:${phone.replace(/\s/g, '')}`} className="hs-hero-cta-phone">
                <Phone size={16} /> {formattedPhone}
              </Link>
            </div>
          </div>

          {/* CENTER: Hero Image */}
          <div className="hs-hero-img-wrap">
            <img
              src={imgSrc}
              alt={hero?.title || 'Hải sản tươi sống'}
              className="hs-hero-img"
              onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = FALLBACK_IMG; } }}
            />
            {heroBanners.length > 1 && (
              <div className="hs-hero-dots">
                {heroBanners.map((_, i) => (
                  <button
                    key={i}
                    className={`hs-hero-dot${i === activeIdx ? ' hs-hero-dot--on' : ''}`}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Ảnh ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Promo Card */}
          <div className="hs-hero-promo">
            <div className="hs-promo-card">
              <div className="hs-promo-header">
                <div className="hs-promo-title-wrap">
                  <div className="hs-promo-icon"><Zap size={18} /></div>
                  <div>
                    <h3>Ưu đãi hôm nay</h3>
                    <p>Giảm giá sốc trong ngày</p>
                  </div>
                </div>
                <span className="hs-promo-pill"><Percent size={12} /> Flash sale</span>
              </div>
              <div className="hs-promo-count-label"><Clock size={13} /> Kết thúc sau</div>
              <div className="hs-promo-countdown">
                <div className="hs-countdown-unit"><span>{String(timeLeft.h).padStart(2, '0')}</span><small>Giờ</small></div>
                <span className="hs-countdown-sep">:</span>
                <div className="hs-countdown-unit"><span>{String(timeLeft.m).padStart(2, '0')}</span><small>Phút</small></div>
                <span className="hs-countdown-sep">:</span>
                <div className="hs-countdown-unit"><span>{String(timeLeft.s).padStart(2, '0')}</span><small>Giây</small></div>
              </div>
              <div className="hs-promo-products">
                {promoProducts.slice(0, 2).map(p => (
                  <Link href={`/products/${p.slug}`} key={p.id} className="hs-promo-item">
                    <img src={resolveUploadUrl(p.images?.[0]?.imageUrl) || PROD_IMG} alt={p.name} className="hs-promo-item-img"
                      onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = PROD_IMG; } }} />
                    <div className="hs-promo-item-info">
                      <div className="hs-promo-item-meta"><Tag size={11} /> Deal giới hạn</div>
                      <span className="hs-promo-item-name">{p.name}</span>
                      <span className="hs-promo-item-weight">/{p.unit}</span>
                      <div className="hs-promo-item-price">
                        <strong>{money(Number(p.basePrice))}</strong>
                        {p.oldPrice && <del>{money(Number(p.oldPrice))}</del>}
                      </div>
                    </div>
                    {p.oldPrice && <span className="hs-promo-badge">-{Math.round((1 - p.basePrice / p.oldPrice) * 100)}%</span>}
                  </Link>
                ))}
              </div>
              <div className="hs-promo-progress">
                <div className="hs-promo-progress-top">
                  <span>Số lượng có hạn</span>
                  <b>Đã bán 68%</b>
                </div>
                <div className="hs-promo-progress-bar"><span /></div>
              </div>
              <div className="hs-promo-benefits">
                <span><CheckCircle2 size={14} /> Freeship đơn từ 500k</span>
                <span><CheckCircle2 size={14} /> Áp dụng đến 23:59 hôm nay</span>
              </div>
              <Link href="/products?promotion=true" className="hs-promo-link">Mua ưu đãi ngay <ChevronRight size={16} /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   CATEGORIES
   ───────────────────────────────────────── */
function DesktopCategories({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="hs-cats-section">
      <div className="hs-container">
        <div className="hs-cats-grid">
          {categories.map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="hs-cat-card">
              <div className="hs-cat-img-wrap">
                <img
                  src={cat.imageUrl || CAT_IMG}
                  alt={cat.name}
                  className="hs-cat-img"
                  onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = CAT_IMG; } }}
                />
                {cat.name.includes('Combo') && <span className="hs-cat-hot">HOT</span>}
              </div>
              <span className="hs-cat-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   DELIVERY CARD
   ───────────────────────────────────────── */
function DesktopDeliveryCard({ zones }: { zones: ShippingZone[] }) {
  const activeZones = zones.filter(z => z.isActive);
  const primaryZone = activeZones[0];
  const subtitle = primaryZone?.name || 'Khu vực TP.HCM & lân cận';
  const freeFrom = primaryZone ? Number(primaryZone.freeFromAmount) : 500000;

  return (
    <div className="hs-delivery-card">
      {/* Header */}
      <div className="hs-delivery-header">
        <div className="hs-delivery-icon"><Truck size={26} /></div>
        <div>
          <h3>Giao nhanh trong 2 giờ</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {/* Zone chips from API */}
      {activeZones.length > 0 && (
        <div className="hs-delivery-zones">
          {activeZones.slice(0, 4).map(z => (
            <span key={z.id} className="hs-delivery-zone-tag">
              <MapPin size={10} />{z.name}
            </span>
          ))}
        </div>
      )}

      {/* Benefits */}
      <div className="hs-delivery-info">
        <div className="hs-delivery-item">
          <CheckCircle2 size={14} /><span>Giao trước 22:00 mỗi ngày</span>
        </div>
        <div className="hs-delivery-item">
          <CheckCircle2 size={14} /><span>Đổi trả dễ dàng trong 24h</span>
        </div>
        <div className="hs-delivery-item hs-delivery-item-free">
          <Percent size={14} />
          <span>Miễn phí vận chuyển từ {money(freeFrom)}</span>
        </div>
      </div>

      <Link href="/products" className="hs-delivery-btn">
        Đặt hàng ngay <ChevronRight size={14} />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────
   BEST SELLERS
   ───────────────────────────────────────── */
function DesktopBestSellers({ products }: { products: HomeProduct[] }) {
  const items = products.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div className="hs-bestseller-col">
      <div className="hs-col-header">
        <h2><span className="hs-col-icon">🔥</span> Sản phẩm bán chạy</h2>
        <Link href="/products" className="hs-col-link">Xem tất cả <ChevronRight size={14} /></Link>
      </div>
      <div className="hs-bestseller-grid">
        {items.map(p => <DesktopProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   COMBO CARD
   ───────────────────────────────────────── */
const COMBO_FALLBACK = 'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=400';

function DesktopComboCard({ comboProducts }: { comboProducts: HomeProduct[] }) {
  const thumbs = comboProducts.slice(0, 3);
  const minPrice = comboProducts.length > 0
    ? Math.min(...comboProducts.map(p => Number(p.basePrice)))
    : 0;

  return (
    <div className="hs-combo-card">
      <div className="hs-combo-bg" />
      <div className="hs-combo-inner">
        {/* Left: Text content */}
        <div className="hs-combo-content">
          <span className="hs-combo-tag"><Tag size={10} /> Tiết kiệm hơn</span>
          <h3>Combo Gia Đình</h3>
          <p>Ngon hơn — Đủ món — Tiện lợi</p>
          <span className="hs-combo-badge">Giảm đến 20%</span>
          {comboProducts.length > 0 && (
            <div className="hs-combo-stats">
              <span className="hs-combo-stat"><Package size={12} /> {comboProducts.length} combo</span>
              {minPrice > 0 && <span className="hs-combo-stat">Từ {money(minPrice)}</span>}
            </div>
          )}
          <Link href="/products?category=combo" className="hs-combo-btn">
            Xem các combo <ChevronRight size={14} />
          </Link>
        </div>

        {/* Right: Product thumbnails */}
        {thumbs.length > 0 ? (
          <div className="hs-combo-thumbs">
            {thumbs.map((p, i) => (
              <Link key={p.id} href={`/products/${p.slug}`} className={`hs-combo-thumb hs-combo-thumb-${i}`}>
                <img
                  src={p.images?.[0]?.imageUrl || COMBO_FALLBACK}
                  alt={p.name}
                  onError={e => { const t = e.currentTarget as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = COMBO_FALLBACK; } }}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="hs-combo-thumbs">
            <div className="hs-combo-thumb hs-combo-thumb-0">
              <img src={COMBO_FALLBACK} alt="Combo hải sản" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PRODUCT CARD
   ───────────────────────────────────────── */
function DesktopProductCard({ product }: { product: HomeProduct }) {
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
    <Link href={`/products/${product.slug}`} className="hs-dt-prod-card">
      <div className="hs-dt-prod-img">
        <img
          src={product.images?.[0]?.imageUrl || PROD_IMG}
          alt={product.name}
          onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = PROD_IMG; } }}
        />
        {product.badge && <span className="hs-dt-prod-badge">{BADGE_MAP[product.badge]}</span>}
      </div>
      <div className="hs-dt-prod-info">
        <h4>{product.name}</h4>
        {product.shortDescription && <p>{product.shortDescription}</p>}
        {(product.ratingAvg ?? 0) > 0 && (
          <div className="hs-dt-prod-rating">
            <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
            <span>{Number(product.ratingAvg).toFixed(1)}</span>
            {product.soldCount && <span className="hs-dt-prod-sold">| {product.soldCount}+ đã bán</span>}
          </div>
        )}
        <div className="hs-dt-prod-bottom">
          <div className="hs-dt-prod-price">
            <strong>{money(Number(product.basePrice))}</strong>
            <small>/{product.unit}</small>
            {product.oldPrice && <del>{money(Number(product.oldPrice))}</del>}
          </div>
          <button className={`hs-dt-prod-add ${adding ? 'adding' : ''}`} onClick={handleAdd} disabled={adding}>
            {adding ? '✓' : '+'}
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────
   FEATURED SECTION
   ───────────────────────────────────────── */
function DesktopFeaturedSection({ products }: { products: HomeProduct[] }) {
  const items = products.slice(0, 8);
  return (
    <section className="hs-featured-section">
      <div className="hs-container">
        <div className="hs-col-header">
          <h2><Star size={18} fill="#f59e0b" stroke="#f59e0b" /> Sản phẩm nổi bật</h2>
          <Link href="/products" className="hs-col-link">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        <div className="hs-featured-grid">
          {items.map(p => <DesktopProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   TRUST BADGES
   ───────────────────────────────────────── */
function DesktopTrustBadges() {
  const badges = [
    { icon: <Leaf size={22} />, title: '100% tươi sống', sub: 'Đánh bắt mỗi ngày' },
    { icon: <RotateCcw size={22} />, title: 'Hoàn tiền 100%', sub: 'Nếu không tươi' },
    { icon: <Scale size={22} />, title: 'Cân đúng — Giá rõ', sub: 'Minh bạch tuyệt đối' },
    { icon: <Package size={22} />, title: 'Đóng gói cẩn thận', sub: 'Giữ tươi khi giao' },
    { icon: <Phone size={22} />, title: 'Hỗ trợ 24/7', sub: 'Tư vấn tận tâm' },
  ];
  return (
    <section className="hs-trust-section">
      <div className="hs-container">
        <div className="hs-trust-grid">
          {badges.map((b, i) => (
            <div className="hs-trust-item" key={i}>
              <div className="hs-trust-icon">{b.icon}</div>
              <div className="hs-trust-text">
                <strong>{b.title}</strong>
                <span>{b.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   BUY TOGETHER
   ───────────────────────────────────────── */
function DesktopBuyTogether({ products }: { products: HomeProduct[] }) {
  const items = products.slice(0, 4);

  return (
    <section className="hs-buy-section">
      <div className="hs-container">
        <div className="hs-col-header">
          <h2><ShoppingCart size={18} /> Thường mua cùng</h2>
          <Link href="/products?category=combo" className="hs-col-link">Xem combo <ChevronRight size={14} /></Link>
        </div>
        <div className="hs-buy-grid">
          {items.map(p => <DesktopProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
