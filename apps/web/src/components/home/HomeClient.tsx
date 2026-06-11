'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck, ShieldCheck, Scale, ChevronRight,
  ShoppingCart, Phone,
  Leaf, Star,
  Flame, Headphones, Package, Undo2,
} from 'lucide-react';
import { img } from '@/lib/api';
import { money } from '@/lib/money';
import { useCart } from '@/lib/cart-store';
import ProductCard from '@/components/shared/ProductCard';
import SiteShell from '@/components/shared/SiteShell';
import HomePromoCards from '@/components/home/HomePromoCards';

export type HomeCategory = { id: string; name: string; imageUrl?: string; slug: string };
export type HomeProduct = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg?: number; soldCount?: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};
export type HomeBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  link?: string;
};

export type HomeVisibility = {
  categories: boolean;
  promo: boolean;
  newArrival: boolean;
  featured: boolean;
  bestSeller: boolean;
};

export type HomeSectionPublic = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled: boolean;
  maxItems: number;
  products: HomeProduct[];
};

type HomeClientProps = {
  categories: HomeCategory[];
  products: HomeProduct[];
  banners: HomeBanner[];
  heroBanners?: HomeBanner[];
  featuredProducts: HomeProduct[];
  bestSellerProducts: HomeProduct[];
  visible: HomeVisibility;
  homeSections?: HomeSectionPublic[];
};

const DEFAULT_VISIBLE: HomeVisibility = {
  categories: true,
  promo: true,
  newArrival: true,
  featured: true,
  bestSeller: true,
};

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy',
  UU_DAI: 'Ưu đãi',
  TUOI_NGON: 'Tươi ngon',
  MOI: 'Mới',
};

export default function HomeClient({ categories, products, banners, heroBanners = [], featuredProducts, bestSellerProducts, visible = DEFAULT_VISIBLE, homeSections = [] }: HomeClientProps) {
  const todaySection = homeSections.find((s) => s.slug === 'today-suggestion');
  const comboSection = homeSections.find((s) => s.slug === 'frequently-bought');

  return (
    <SiteShell>
      <HeroSection banners={heroBanners} />
      {visible.categories && <CategoryStrip categories={categories} />}
      {visible.promo && <HomePromoCards banners={banners} />}
      {visible.newArrival && (
        <BuyTogetherSection products={products} section={comboSection} />
      )}
      {visible.featured && <FeaturedSection products={featuredProducts} />}
      {visible.bestSeller && <BestSellerSection products={bestSellerProducts} todaySection={todaySection} />}
      <CommitmentBar />
    </SiteShell>
  );
}

/* ============================================
   HERO SECTION — Data-driven from HOME_HERO banners
   ============================================ */
const HERO_FALLBACK_IMAGE = 'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=1600';

function HeroSection({ banners }: { banners: HomeBanner[] }) {
  const hero = banners[0];
  const imgSrc = hero?.imageUrl || HERO_FALLBACK_IMAGE;
  const imgAlt = hero?.title || 'Hải sản tươi sống - tôm, cua, ghẹ, sò';
  const ctaHref = hero?.linkUrl || hero?.link || '/products';

  return (
    <section className="hs-hero-wrap">
      <div className="hs-container">
        <div className="hs-hero-card">
          <div className="hs-hero-left">
            <span className="hs-hero-label">HẢI SẢN BIỂN XANH</span>
            <h1 className="hs-hero-title">
              {hero?.title ? (
                <span className="hs-hero-title-highlight">{hero.title.toUpperCase()}</span>
              ) : (
                <>HẢI SẢN <span className="hs-hero-title-highlight">TƯƠI SỐNG</span></>
              )}
            </h1>
            <p className="hs-hero-sub">GIAO NHANH TRONG NGÀY</p>
            <p className="hs-hero-desc">
              {hero?.subtitle || 'Hải sản tươi mỗi ngày, giao nhanh trong ngày, chất lượng tin cậy tại TP.HCM.'}
            </p>
            <HeroBenefits />
            <HeroActions ctaHref={ctaHref} />
          </div>
          <div className="hs-hero-right">
            <div className="hs-hero-image">
              <img
                src={imgSrc}
                alt={imgAlt}
                width={1862}
                height={845}
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = HERO_FALLBACK_IMAGE; }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBenefits() {
  const benefits = [
    { icon: <Leaf size={18} />, title: 'Tươi sống', sub: 'Mỗi ngày' },
    { icon: <Truck size={18} />, title: 'Giao nhanh', sub: '2h tại TP.HCM' },
    { icon: <ShieldCheck size={18} />, title: 'Đổi trả', sub: 'Nếu không tươi' },
    { icon: <Scale size={18} />, title: 'Giá hợp lý', sub: 'Minh bạch, rõ ràng' },
  ];
  return (
    <div className="hs-hero-benefits">
      {benefits.map((b, i) => (
        <div className="hs-hero-benefit" key={i}>
          <div className="hs-hero-benefit-icon">{b.icon}</div>
          <div className="hs-hero-benefit-text">
            <b>{b.title}</b>
            <small>{b.sub}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroActions({ ctaHref }: { ctaHref: string }) {
  return (
    <div className="hs-hero-ctas">
      <Link href={ctaHref} className="hs-hero-btn-primary">
        <ShoppingCart size={18} /> ĐẶT HÀNG NGAY
      </Link>
      <Link href="tel:0901234567" className="hs-hero-btn-outline">
        <Phone size={18} /> GỌI NGAY 0901 234 567
      </Link>
    </div>
  );
}

/* ============================================
   CATEGORY STRIP
   ============================================ */
function CategoryStrip({ categories }: { categories: HomeCategory[] }) {
  const cats = categories;

  if (cats.length === 0) return null;

  return (
    <section className="hs-cat-section">
      <div className="hs-container">
        <div className="hs-cat-strip">
          {cats.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="hs-cat-card">
              <div className="hs-cat-img-wrap">
                <img src={cat.imageUrl || img('cat-tom.svg')} alt={cat.name}
                  onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400'; } }} />
                {cat.name === 'Combo hot' && <span className="hs-cat-badge">HOT</span>}
              </div>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   BUY TOGETHER SECTION
   ============================================ */
function BuyTogetherSection({ products, section }: { products: HomeProduct[]; section?: HomeSectionPublic }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const sectionProducts = section?.products?.length ? section.products : products;
  const items = sectionProducts.slice(0, section?.maxItems ?? 3);
  const title = section?.title || 'Thường mua cùng';
  const ctaText = section?.ctaText || 'Xem combo';
  const ctaUrl = section?.ctaUrl || '/products?category=combo';
  const description = section?.description;
  const subtotal = items.reduce((sum, item) => sum + Number(item.basePrice), 0);

  const handleAddBundle = async () => {
    if (adding) return;
    setAdding(true);
    for (const product of items) {
      await addToCart({
        productId: product.id,
        quantity: 1,
        selectedUnit: product.unit,
        priceAtTime: Number(product.basePrice),
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: Number(product.basePrice),
          unit: product.unit,
          images: product.images || [],
        },
      });
    }
    setAdding(false);
  };

  return (
    <section className="hs-buy-together-section">
      <div className="hs-container">
        <div className="hs-buy-together">
          <div className="hs-buy-together-head">
            <div className="hs-section-title">
              <ShoppingCart size={20} />
              <h2>{title}</h2>
            </div>
            <Link href={ctaUrl} className="hs-section-link">
              {ctaText} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="hs-buy-together-grid">
            <div className="hs-bundle-items">
              {items.map((product, index) => (
                <div className="hs-bundle-item-wrap" key={product.id}>
                  <Link href={`/products/${product.slug}`} className="hs-bundle-item">
                    <div className="hs-bundle-img">
                      <img
                        src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')}
                        alt={product.name}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = img('tom-fallback.jpg');
                          }
                        }}
                      />
                    </div>
                    <div className="hs-bundle-info">
                      <b>{product.name}</b>
                      <span>{product.shortDescription || `Tươi ngon /${product.unit}`}</span>
                      <strong>{money(Number(product.basePrice))}<small>/{product.unit}</small></strong>
                    </div>
                  </Link>
                  {index < items.length - 1 && <div className="hs-bundle-plus">+</div>}
                </div>
              ))}
            </div>

            <aside className="hs-bundle-summary">
              {section?.subtitle && <span className="hs-bundle-tag">{section.subtitle}</span>}
              <h3>{section?.title || 'Set hải sản đủ món'}</h3>
              {description && <p>{description}</p>}
              <div className="hs-bundle-price-row">
                <span>Tạm tính</span>
                <b>{money(subtotal)}</b>
              </div>
              <button type="button" className="hs-bundle-add" onClick={handleAddBundle} disabled={adding}>
                <ShoppingCart size={18} />
                {adding ? 'Đang thêm...' : (section?.ctaText || 'Thêm cả bộ vào giỏ')}
              </button>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FEATURED SECTION
   ============================================ */
function FeaturedSection({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const items = products.slice(0, 8);

  return (
    <section className="hs-featured-section">
      <div className="hs-container">
        <div className="hs-section-header">
          <div className="hs-section-title hs-featured-title">
            <Star size={18} fill="#f59e0b" stroke="#f59e0b" />
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <Link href="/products" className="hs-section-link">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        <div className="hs-featured-grid">
          {items.map(p => <FeaturedCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ product }: { product: HomeProduct }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    await addToCart({
      productId: product.id,
      variantId: undefined,
      quantity: 1,
      selectedUnit: product.unit,
      priceAtTime: Number(product.basePrice),
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: Number(product.basePrice),
        unit: product.unit,
        images: product.images || [],
      },
    });
    setAdding(false);
  };

  return (
    <article className="hs-feat-card">
      <Link href={`/products/${product.slug}`} className="hs-feat-inner">
        <div className="hs-feat-img">
          <img
            src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')}
            alt={product.name}
            onError={(e) => {
              const t = e.currentTarget;
              if (!t.dataset.fallback) {
                t.dataset.fallback = 'true';
                t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400';
              }
            }}
          />
          {product.badge && <span className="hs-feat-badge">{BADGE_MAP[product.badge] ?? product.badge}</span>}
        </div>
        <div className="hs-feat-body">
          <span className="hs-feat-name">{product.name}</span>
          <div className="hs-feat-price">
            <b>{money(Number(product.basePrice))}<small>/{product.unit}</small></b>
            {product.oldPrice && <del>{money(Number(product.oldPrice))}</del>}
          </div>
        </div>
      </Link>
      <button className="hs-feat-cart" onClick={handleAdd} disabled={adding} aria-label="Thêm vào giỏ">
        <ShoppingCart size={14} />
      </button>
    </article>
  );
}

/* ============================================
   BEST SELLER SECTION (6-col grid + side promo)
   ============================================ */
function BestSellerSection({ products, todaySection }: { products: HomeProduct[]; todaySection?: HomeSectionPublic }) {
  if (products.length === 0) return null;

  const sidebarProducts = todaySection?.enabled !== false && (todaySection?.products?.length ?? 0) > 0
    ? todaySection!.products
    : null;
  const showSidebar = sidebarProducts !== null;

  return (
    <section className="hs-best-section">
      <div className="hs-container">
        <div className={showSidebar ? 'hs-best-layout' : 'hs-best-layout hs-best-layout--full'}>
          <div className="hs-best-main">
            <div className="hs-section-header">
              <div className="hs-section-title">
                <Flame size={20} />
                <h2>Sản phẩm bán chạy</h2>
              </div>
              <Link href="/products" className="hs-section-link">Xem tất cả <ChevronRight size={14} /></Link>
            </div>
            <div className="hs-product-grid hs-grid-12">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

          {showSidebar && <SidePromoBanner products={sidebarProducts!} section={todaySection} />}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   SIDE PROMO BANNER
   ============================================ */
function SidePromoBanner({ products, section }: { products: HomeProduct[]; section?: HomeSectionPublic }) {
  const items = products.slice(0, 3);
  const title = section?.title || 'Gợi ý hôm nay';
  const subtitle = section?.subtitle || 'Sản phẩm đang bán từ dữ liệu hiện tại';
  const ctaText = section?.ctaText || 'Xem sản phẩm';
  const ctaUrl = section?.ctaUrl || '/products';
  if (items.length === 0) return null;

  return (
    <div className="hs-side-promo">
      <div className="hs-side-promo-inner">
        <div className="hs-side-promo-badge"><Flame size={14} /> DB</div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div className="hs-side-promo-list">
          {items.map((product) => (
            <div className="hs-side-promo-item" key={product.id}>
              <img src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={product.name}
                onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=400'; } }} />
              <div>
                <b>{product.name}</b>
                <small>{money(Number(product.basePrice))}/{product.unit}</small>
              </div>
            </div>
          ))}
        </div>
        <Link href={ctaUrl} className="hs-side-promo-btn">{ctaText} <ChevronRight size={14} /></Link>
      </div>
    </div>
  );
}

/* ============================================
   COMMITMENT BAR
   ============================================ */
function CommitmentBar() {
  const items = [
    { icon: <Leaf size={22} />, title: '100% tươi sống', sub: 'Đánh bắt mỗi ngày' },
    { icon: <Undo2 size={22} />, title: 'Hoàn tiền 100%', sub: 'Nếu không tươi' },
    { icon: <Scale size={22} />, title: 'Cân đúng — Giá rõ ràng', sub: 'Minh bạch tuyệt đối' },
    { icon: <Package size={22} />, title: 'Đóng gói cẩn thận', sub: 'Giữ tươi khi giao' },
    { icon: <Headphones size={22} />, title: 'Hỗ trợ 24/7', sub: 'Tư vấn tận tâm' },
  ];
  return (
    <section className="hs-commit-section">
      <div className="hs-container">
        <div className="hs-commit-grid">
          {items.map((item, i) => (
            <div className="hs-commit-item" key={i}>
              <div className="hs-commit-icon">{item.icon}</div>
              <div>
                <b>{item.title}</b>
                <span>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
