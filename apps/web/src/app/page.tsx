'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Truck, ShieldCheck, Scale, RotateCcw, ChevronRight, Star,
  Search, ShoppingCart, Heart, User, Menu, MapPin, Phone, Home,
  Leaf, Facebook, MessageCircle,
  Flame, Headphones, Package, Undo2, Zap, Percent, Mail,
} from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';
import CitySelector from '@/lib/CitySelector';

type Category = { id: string; name: string; imageUrl?: string; slug: string };
type Product = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg: number; soldCount: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api<{ data: Category[] }>('/api/categories').then(r => setCategories(r.data)).catch(() => {});
    api<{ data: Product[] }>('/api/products?sort=sold&limit=6').then(r => setProducts(r.data)).catch(() => {});
    api<{ data: { items: any[] } }>('/api/carts').then(r => {
      setCartCount(r.data?.items?.length || 0);
    }).catch(() => {});
  }, []);

  return (
    <div className="hs-page">
      <TopBar />
      <Header cartCount={cartCount} search={search} setSearch={setSearch} />
      <NavBar />
      <HeroSection />
      <CategoryStrip categories={categories} />
      <PromoBanners />
      <BestSellerSection products={products} onCartUpdate={() => {
        api<{ data: { items: any[] } }>('/api/carts').then(r => setCartCount(r.data?.items?.length || 0)).catch(() => {});
      }} />
      <CommitmentBar />
      <Footer />
      <MobileNav />
    </div>
  );
}

/* ============================================
   TOPBAR
   ============================================ */
function TopBar() {
  return (
    <div className="hs-topbar">
      <div className="hs-container hs-topbar-inner">
        <span><Truck size={14} /> Miễn phí giao đơn từ 500k</span>
        <span><ShieldCheck size={14} /> Đổi trả trong 24h</span>
        <span><RotateCcw size={14} /> Hoàn tiền 100% nếu không tươi</span>
        <span className="hs-topbar-push"><Phone size={14} /> Hotline: <b>0901 234 567</b></span>
      </div>
    </div>
  );
}

/* ============================================
   HEADER
   ============================================ */
function Header({ cartCount, search, setSearch }: { cartCount: number; search: string; setSearch: (v: string) => void }) {
  return (
    <header className="hs-header">
      <div className="hs-container hs-header-inner">
        <Link href="/" className="hs-logo">
          <div className="hs-logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              <path d="M16 8l-3 7h6l-3-7z" fill="currentColor"/>
            </svg>
          </div>
          <div className="hs-logo-text">
            <span className="hs-logo-top">HẢI SẢN</span>
            <span className="hs-logo-bottom">BIỂN XANH</span>
          </div>
        </Link>

        <CitySelector />

        <div className="hs-search">
          <Search size={18} className="hs-search-icon" />
          <input placeholder="Tìm kiếm hải sản tươi ngon..." value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) window.location.href = `/products?search=${encodeURIComponent(search.trim())}`; }} />
          <button className="hs-search-btn" onClick={() => { if (search.trim()) window.location.href = `/products?search=${encodeURIComponent(search.trim())}`; }}><Search size={16} /></button>
        </div>

        <div className="hs-header-right">
          <Link href="/account" className="hs-hotline">
            <User size={20} />
            <div>
              <b>Tài khoản</b>
              <small>Đăng nhập</small>
            </div>
          </Link>
          <Link href="/cart" className="hs-cart">
            <div className="hs-cart-icon">
              <ShoppingCart size={22} />
              {cartCount > 0 && <i>{cartCount}</i>}
            </div>
            <span>Giỏ hàng</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================================
   NAVIGATION
   ============================================ */
function NavBar() {
  const menu = [
    { label: 'Trang chủ', href: '/', active: true },
    { label: 'Tôm', href: '/products?category=tom' },
    { label: 'Cua - Ghẹ', href: '/products?category=cua-ghe' },
    { label: 'Cá', href: '/products?category=ca' },
    { label: 'Mực', href: '/products?category=muc' },
    { label: 'Ốc - Sò', href: '/products?category=oc-so' },
    { label: 'Combo', href: '/products?category=combo' },
    { label: 'Khuyến mãi', href: '/products' },
    { label: 'Tin tức', href: '/' },
  ];
  return (
    <nav className="hs-nav">
      <div className="hs-container hs-nav-inner">
        <button className="hs-cat-btn"><Menu size={20} /><span>Danh mục</span></button>
        <div className="hs-nav-links">
          {menu.map(m => (
            <Link key={m.label} href={m.href} className={`hs-nav-link ${m.active ? 'active' : ''}`}>
              {m.active && <Home size={14} />}
              {m.label}
            </Link>
          ))}
        </div>
        <Link href="/admin" className="hs-admin-link">Admin</Link>
      </div>
    </nav>
  );
}

/* ============================================
   HERO SECTION
   ============================================ */
function HeroSection() {
  return (
    <section className="hs-hero-wrap">
      <div className="hs-container">
        <div className="hs-hero">
          <HeroContent />
          <HeroImage />
        </div>
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="hs-hero-left">
      <HeroBadge />

      <h1 className="hs-hero-title">
        HẢI SẢN TƯƠI SỐNG
      </h1>
      <p className="hs-hero-sub">
        GIAO NHANH TRONG NGÀY
      </p>

      <HeroBenefits />

      <HeroActions />
    </div>
  );
}

function HeroBadge() {
  return (
    <div className="hs-hero-badge">
      <span className="hs-hero-badge-icon">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
          <path d="M16 8l-3 7h6l-3-7z" fill="currentColor"/>
        </svg>
      </span>
      <span>HẢI SẢN BIỂN XANH</span>
    </div>
  );
}

function HeroBenefits() {
  const benefits = [
    { icon: <Leaf size={17} />, title: 'TƯƠI SỐNG', sub: 'Mỗi ngày' },
    { icon: <Truck size={17} />, title: 'GIAO NHANH', sub: '2h tại TP.HCM' },
    { icon: <ShieldCheck size={17} />, title: 'ĐỔI TRẢ', sub: 'Nếu không tươi' },
    { icon: <Scale size={17} />, title: 'CÂN ĐÚNG', sub: 'Giá rõ ràng' },
  ];
  return (
    <div className="hs-hero-commits">
      {benefits.map((b, i) => (
        <div className="hs-hero-commit" key={i}>
          <div className="hs-hero-commit-icon">{b.icon}</div>
          <div className="hs-hero-commit-text">
            <b>{b.title}</b>
            <small>{b.sub}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroActions() {
  return (
    <div className="hs-hero-ctas">
      <Link href="/products" className="hs-btn-primary">
        <ShoppingCart size={18} /> ĐẶT HÀNG NGAY
      </Link>
      <Link href="tel:0901234567" className="hs-btn-outline">
        <Phone size={18} /> GỌI NGAY
      </Link>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="hs-hero-center">
      <img
        src="/assets/hero-modern-seafood.png"
        alt="Hải sản tươi sống - tôm, cua, ghẹ, sò, chanh"
        width={1862}
        height={845}
      />
    </div>
  );
}

/* ============================================
   CATEGORY STRIP
   ============================================ */
function CategoryStrip({ categories }: { categories: Category[] }) {
  const cats = categories.length > 0 ? categories : [
    { id: '1', name: 'Tôm', slug: 'tom', imageUrl: img('cat-tom.jpg') },
    { id: '2', name: 'Cua - Ghẹ', slug: 'cua-ghe', imageUrl: img('cat-cua.jpg') },
    { id: '3', name: 'Cá', slug: 'ca', imageUrl: img('cat-ca.jpg') },
    { id: '4', name: 'Mực', slug: 'muc', imageUrl: img('cat-muc.jpg') },
    { id: '5', name: 'Ốc - Sò', slug: 'oc-so', imageUrl: img('cat-oc.jpg') },
    { id: '6', name: 'Hàu - Sò điệp', slug: 'haau-so-diep', imageUrl: img('cat-so-che.jpg') },
    { id: '7', name: 'Combo hot', slug: 'combo', imageUrl: img('cat-combo.jpg') },
    { id: '8', name: 'Hải sản chế biến', slug: 'hai-san-so-che', imageUrl: img('cat-so-che.jpg') },
  ];

  return (
    <section className="hs-cat-section">
      <div className="hs-container">
        <div className="hs-cat-strip">
          {cats.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`} className="hs-cat-card">
              <div className="hs-cat-img-wrap">
                <img src={cat.imageUrl || img('cat-tom.jpg')} alt={cat.name} />
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
   PROMO BANNERS (4 cards)
   ============================================ */
function PromoBanners() {
  const banners = [
    {
      icon: <Flame size={24} />,
      title: 'Combo tiết kiệm',
      desc: 'Mua combo — Tiết kiệm đến 20%',
      bg: 'hs-promo-red',
      href: '/products?category=combo',
    },
    {
      icon: <Zap size={24} />,
      title: 'Sơ chế tiện lợi',
      desc: 'Hải sản sơ chế, nấu ngay',
      bg: 'hs-promo-green',
      href: '/products?category=hai-san-so-che',
    },
    {
      icon: <Percent size={24} />,
      title: 'Ưu đãi hôm nay',
      desc: 'Giảm đến 15% cho đơn đầu tiên',
      bg: 'hs-promo-orange',
      href: '/products',
    },
    {
      icon: <Mail size={24} />,
      title: 'Đăng ký nhận ưu đãi',
      desc: 'Nhận mã giảm giá 100k',
      bg: 'hs-promo-blue',
      href: '/products',
    },
  ];

  return (
    <section className="hs-promo-section">
      <div className="hs-container">
        <div className="hs-promo-grid">
          {banners.map((b, i) => (
            <Link key={i} href={b.href} className={`hs-promo-card ${b.bg}`}>
              <div className="hs-promo-icon">{b.icon}</div>
              <div className="hs-promo-info">
                <b>{b.title}</b>
                <span>{b.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   BEST SELLER SECTION (6-col grid + side promo)
   ============================================ */
function BestSellerSection({ products, onCartUpdate }: { products: Product[]; onCartUpdate?: () => void }) {
  return (
    <section className="hs-best-section">
      <div className="hs-container">
        <div className="hs-best-layout">
          <div className="hs-best-main">
            <div className="hs-section-header">
              <div className="hs-section-title">
                <Flame size={20} />
                <h2>Sản phẩm bán chạy</h2>
              </div>
              <Link href="/products" className="hs-section-link">Xem tất cả <ChevronRight size={14} /></Link>
            </div>
            <div className="hs-product-grid">
              {products.slice(0, 6).map(p => (
                <ProductCard key={p.id} product={p} onCartUpdate={onCartUpdate} />
              ))}
              {products.length === 0 && (
                <>
                  <ProductCardSkeleton name="Tôm sú size L" price="370.000" unit="kg" badge="Bán chạy" rating={4.8} reviews={128} oldPrice="420.000" />
                  <ProductCardSkeleton name="Ghẹ xanh size 3" price="280.000" unit="con" badge="Ưu đãi" rating={4.8} reviews={98} oldPrice="320.000" />
                  <ProductCardSkeleton name="Mực ống size 20-30" price="260.000" unit="kg" badge="Tươi ngon" rating={4.7} reviews={76} />
                  <ProductCardSkeleton name="Ngao hoa" price="75.000" unit="kg" rating={4.6} reviews={54} />
                  <ProductCardSkeleton name="Tôm thẻ chân trắng" price="195.000" unit="kg" badge="Mới" rating={4.5} reviews={42} />
                  <ProductCardSkeleton name="Cua biển Cà Mau" price="450.000" unit="kg" badge="Cao cấp" rating={4.9} reviews={210} oldPrice="520.000" />
                </>
              )}
            </div>
          </div>

          <SidePromoBanner />
        </div>
      </div>
    </section>
  );
}

/* ============================================
   SIDE PROMO BANNER
   ============================================ */
function SidePromoBanner() {
  return (
    <div className="hs-side-promo">
      <div className="hs-side-promo-inner">
        <div className="hs-side-promo-badge"><Flame size={14} /> HOT</div>
        <h3>Combo gia đình</h3>
        <p>Tiết kiệm hơn — Ngon hơn</p>
        <div className="hs-side-promo-discount">
          <span>Giảm đến</span>
          <b>20%</b>
        </div>
        <div className="hs-side-promo-list">
          <div className="hs-side-promo-item">
            <img src={img('prod-tom.jpg')} alt="Tôm sú" />
            <div>
              <b>Tôm sú size L</b>
              <small>370.000đ/kg</small>
            </div>
          </div>
          <div className="hs-side-promo-item">
            <img src={img('prod-ghe.jpg')} alt="Ghẹ xanh" />
            <div>
              <b>Ghẹ xanh size 3</b>
              <small>280.000đ/con</small>
            </div>
          </div>
          <div className="hs-side-promo-item">
            <img src={img('prod-muc.jpg')} alt="Mực ống" />
            <div>
              <b>Mực ống size 20-30</b>
              <small>260.000đ/kg</small>
            </div>
          </div>
        </div>
        <Link href="/products?category=combo" className="hs-side-promo-btn">Xem các combo <ChevronRight size={14} /></Link>
      </div>
    </div>
  );
}

/* ============================================
   PRODUCT CARD
   ============================================ */
function ProductCard({ product, onCartUpdate }: { product: Product; onCartUpdate?: () => void }) {
  const [adding, setAdding] = useState(false);
  const badgeMap: Record<string, string> = { BAN_CHAY: 'Bán chạy', UU_DAI: 'Ưu đãi', TUOI_NGON: 'Tươi ngon' };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await api('/api/carts/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1, selected_unit: product.unit, price_at_time: Number(product.basePrice) }),
      });
      onCartUpdate?.();
    } catch {}
    setAdding(false);
  };

  return (
    <article className="hs-pcard">
      <Link href={`/products/${product.slug}`} className="hs-pcard-img">
        <img src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={product.name} />
        {product.badge && <span className="hs-pcard-badge">{badgeMap[product.badge] || product.badge}</span>}
      </Link>
      <div className="hs-pcard-body">
        <Link href={`/products/${product.slug}`} className="hs-pcard-name">{product.name}</Link>
        <small className="hs-pcard-spec">{product.shortDescription || `/${product.unit}`}</small>
        <div className="hs-pcard-rating">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
          <span>{Number(product.ratingAvg).toFixed(1)}</span>
          <small>({product.soldCount})</small>
        </div>
        <div className="hs-pcard-price">
          <b>{money(Number(product.basePrice))}<small>/{product.unit}</small></b>
          {product.oldPrice && <del>{money(Number(product.oldPrice))}</del>}
        </div>
      </div>
      <button className="hs-pcard-cart" onClick={addToCart} disabled={adding}><ShoppingCart size={16} /></button>
    </article>
  );
}

function ProductCardSkeleton({ name, price, unit, badge, rating, reviews, oldPrice }: {
  name: string; price: string; unit: string; badge?: string; rating: number; reviews: number; oldPrice?: string;
}) {
  return (
    <article className="hs-pcard">
      <div className="hs-pcard-img">
        <img src={img('prod-tom.jpg')} alt={name} />
        {badge && <span className="hs-pcard-badge">{badge}</span>}
      </div>
      <div className="hs-pcard-body">
        <span className="hs-pcard-name">{name}</span>
        <small className="hs-pcard-spec">/{unit}</small>
        <div className="hs-pcard-rating">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
          <span>{rating}</span>
          <small>({reviews})</small>
        </div>
        <div className="hs-pcard-price">
          <b>{price}.000đ<small>/{unit}</small></b>
          {oldPrice && <del>{oldPrice}.000đ</del>}
        </div>
      </div>
      <button className="hs-pcard-cart"><ShoppingCart size={16} /></button>
    </article>
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

/* ============================================
   FOOTER
   ============================================ */
function Footer() {
  return (
    <footer className="hs-footer">
      <div className="hs-container">
        <div className="hs-footer-grid">
          <div className="hs-footer-brand">
            <div className="hs-footer-logo">
              <div className="hs-logo-icon" style={{ width: 36, height: 36 }}>
                <svg viewBox="0 0 32 32" fill="none"><path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M4 25c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/></svg>
              </div>
              <span>HẢI SẢN BIỂN XANH</span>
            </div>
            <p>Hải sản tươi sống đánh bắt mỗi ngày, giao hàng nhanh trong 2 giờ tại TP.HCM, Hà Nội & Đà Nẵng.</p>
            <div className="hs-footer-social">
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><MessageCircle size={18} /></a>
              <a href="#"><Phone size={18} /></a>
            </div>
          </div>
          <div className="hs-footer-links">
            <h4>Sản phẩm</h4>
            <Link href="/products?category=tom">Tôm tươi sống</Link>
            <Link href="/products?category=cua-ghe">Cua — Ghẹ</Link>
            <Link href="/products?category=ca">Cá biển tươi</Link>
            <Link href="/products?category=muc">Mực — Bạch tuộc</Link>
            <Link href="/products?category=combo">Combo tiết kiệm</Link>
          </div>
          <div className="hs-footer-links">
            <h4>Hỗ trợ</h4>
            <Link href="/account?tab=orders">Theo dõi đơn hàng</Link>
            <Link href="/account">Tài khoản của tôi</Link>
            <Link href="/products">Chính sách đổi trả</Link>
            <Link href="/products">Hướng dẫn đặt hàng</Link>
          </div>
          <div className="hs-footer-contact">
            <h4>Hệ thống cửa hàng</h4>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>TP. Hồ Chí Minh</b><span>123 Đường Biển, Q.1</span></div></div>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>Hà Nội</b><span>45 Phố Biển, Hoàn Kiếm</span></div></div>
            <div className="hs-contact-item"><MapPin size={16} /><div><b>Đà Nẵng</b><span>78 Bạch Đằng, Hải Châu</span></div></div>
            <div className="hs-contact-item"><Phone size={16} /><div><b>Hotline</b><span>0901 234 567</span></div></div>
          </div>
        </div>
        <div className="hs-footer-bottom">
          <span>&copy; 2026 Hải Sản Biển Xanh. Tất cả quyền được bảo lưu.</span>
          <div className="hs-footer-bottom-links">
            <Link href="#">Chính sách bảo mật</Link>
            <Link href="#">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================
   MOBILE NAV
   ============================================ */
function MobileNav() {
  return (
    <div className="hs-mobile-nav">
      <Link href="/" className="active"><Home size={22} /><span>Trang chủ</span></Link>
      <Link href="/products"><Menu size={22} /><span>Danh mục</span></Link>
      <Link href="/cart"><ShoppingCart size={22} /><span>Giỏ hàng</span></Link>
      <Link href="/account?tab=favorites"><Heart size={22} /><span>Yêu thích</span></Link>
      <Link href="/account"><User size={22} /><span>Tài khoản</span></Link>
    </div>
  );
}
