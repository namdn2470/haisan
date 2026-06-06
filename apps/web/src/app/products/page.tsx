'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, Star, Plus, Filter, ChevronDown, ChevronRight, ShoppingCart,
  User, Home, Menu, MapPin, Phone, Facebook, MessageCircle,
} from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';
import CitySelector from '@/lib/CitySelector';

type Category = { id: string; name: string; slug: string; imageUrl?: string };
type Product = {
  id: string; name: string; slug: string;
  basePrice: number; oldPrice?: number; unit: string;
  badge?: string; ratingAvg: number; soldCount: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
  category?: { name: string };
};

const SORT_OPTIONS = [
  { value: 'sold', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'new', label: 'Mới nhất' },
];

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy', UU_DAI: 'GIẢM GIÁ', TUOI_NGON: 'Tươi ngon',
  MOI: 'Mới', SALE: 'SALE',
};

/* ============================================
   HEADER
   ============================================ */
function Header({ search, setSearch, onSearch }: { search: string; setSearch: (v: string) => void; onSearch: () => void }) {
  return (
    <header className="pg-header">
      <div className="pg-container pg-header-inner">
        <Link href="/" className="pg-logo">
          <div className="pg-logo-icon">
            <svg viewBox="0 0 32 32" fill="none"><path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M16 8l-3 7h6l-3-7z" fill="currentColor"/></svg>
          </div>
          <div className="pg-logo-text">
            <span className="pg-logo-top">HẢI SẢN</span>
            <span className="pg-logo-bottom">BIỂN XANH</span>
          </div>
        </Link>

        <CitySelector />

        <div className="pg-search">
          <Search size={18} className="pg-search-icon" />
          <input
            placeholder="Tìm kiếm hải sản tươi ngon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSearch(); }}
          />
          <button className="pg-search-btn" onClick={onSearch}><Search size={16} /></button>
        </div>

        <div className="pg-header-right">
          <a href="tel:0901234567" className="pg-hotline">
            <Phone size={18} />
            <div><b>0901 234 567</b><small>Hotline 8:00 - 22:00</small></div>
          </a>
          <Link href="/account" className="pg-header-action">
            <User size={20} /><span>Tài khoản</span>
          </Link>
          <Link href="/cart" className="pg-cart-link">
            <div className="pg-cart-icon">
              <ShoppingCart size={20} />
            </div>
            <span>Giỏ hàng</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================================
   NAVIGATION BAR
   ============================================ */
function NavBar({ categorySlug, categories }: { categorySlug: string; categories: Category[] }) {
  return (
    <nav className="pg-nav">
      <div className="pg-container pg-nav-inner">
        <Link href="/products" className={`pg-nav-all ${!categorySlug ? 'active' : ''}`}>
          <Menu size={18} /><span>TẤT CẢ</span>
        </Link>
        {categories.map(c => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className={`pg-nav-link ${c.slug === categorySlug ? 'active' : ''}`}>
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ============================================
   PRODUCT CARD
   ============================================ */
function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await api('/api/carts/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id, quantity: 1,
          selected_unit: product.unit, price_at_time: Number(product.basePrice),
        }),
      });
    } catch {}
    setAdding(false);
  };

  const badgeLabel = product.badge ? (BADGE_MAP[product.badge] || product.badge) : '';

  return (
    <article className="pg-card">
      <Link href={`/products/${product.slug}`} className="pg-card-img">
        <img src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')} alt={product.name} />
        {badgeLabel && <span className="pg-card-badge">{badgeLabel}</span>}
        <button className="pg-card-quick" onClick={addToCart} disabled={adding}>
          <Plus size={18} />
        </button>
      </Link>
      <div className="pg-card-body">
        <Link href={`/products/${product.slug}`} className="pg-card-name">{product.name}</Link>
        <div className="pg-card-rating">
          <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
          <span>{Number(product.ratingAvg).toFixed(1)}</span>
          <small>({product.soldCount} đã bán)</small>
        </div>
        <div className="pg-card-price">
          <b>{money(Number(product.basePrice))}<small>/{product.unit}</small></b>
          {product.oldPrice && <del>{money(Number(product.oldPrice))}</del>}
        </div>
      </div>
      <button className="pg-card-cart" onClick={addToCart} disabled={adding}>
        <ShoppingCart size={16} />
      </button>
    </article>
  );
}

/* ============================================
   FOOTER
   ============================================ */
function Footer() {
  return (
    <footer className="pg-footer">
      <div className="pg-container">
        <div className="pg-footer-grid">
          <div className="pg-footer-brand">
            <div className="pg-footer-logo">
              <div className="pg-footer-logo-icon">
                <svg viewBox="0 0 32 32" fill="none"><path d="M4 20c2-3 5-5 8-5s4 2 4 2 2-2 4-2 6 2 8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M16 8l-3 7h6l-3-7z" fill="currentColor"/></svg>
              </div>
              <span>HẢI SẢN<br />BIỂN XANH</span>
            </div>
            <p>Hải sản tươi sống đánh bắt mỗi ngày, giao hàng nhanh trong 2 giờ tại TP.HCM, Hà Nội &amp; Đà Nẵng.</p>
            <div className="pg-footer-social">
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><MessageCircle size={18} /></a>
              <a href="#"><Phone size={18} /></a>
            </div>
          </div>

          <div className="pg-footer-col">
            <h4>Sản phẩm</h4>
            <Link href="/products?category=tom">Tôm tươi sống</Link>
            <Link href="/products?category=cua-ghe">Cua — Ghẹ</Link>
            <Link href="/products?category=ca">Cá biển tươi</Link>
            <Link href="/products?category=combo">Combo tiết kiệm</Link>
          </div>

          <div className="pg-footer-col">
            <h4>Hỗ trợ</h4>
            <Link href="/account?tab=orders">Theo dõi đơn hàng</Link>
            <Link href="/account">Tài khoản của tôi</Link>
            <Link href="/products">Chính sách đổi trả</Link>
            <Link href="/">FAQ</Link>
          </div>

          <div className="pg-footer-col">
            <h4>Hệ thống cửa hàng</h4>
            <div className="pg-footer-store">
              <MapPin size={15} />
              <div><b>TP. Hồ Chí Minh</b><span>123 Đường Biển, Q.1</span></div>
            </div>
            <div className="pg-footer-store">
              <MapPin size={15} />
              <div><b>Hà Nội</b><span>45 Phố Biển, Hoàn Kiếm</span></div>
            </div>
            <div className="pg-footer-store">
              <MapPin size={15} />
              <div><b>Đà Nẵng</b><span>78 Bạch Đằng, Hải Châu</span></div>
            </div>
            <div className="pg-footer-store">
              <Phone size={15} />
              <div><b>Hotline</b><span>0901 234 567</span></div>
            </div>
          </div>
        </div>

        <div className="pg-footer-bottom">
          <span>© 2026 Hải Sản Biển Xanh. Tất cả quyền được bảo lưu.</span>
          <div className="pg-footer-bottom-links">
            <Link href="#">Chính sách bảo mật</Link>
            <Link href="#">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================
   MOBILE BOTTOM NAV
   ============================================ */
function MobileNav() {
  return (
    <div className="pg-mobile-nav">
      <Link href="/"><Home size={22} /><span>Trang chủ</span></Link>
      <Link href="/products" className="active"><Menu size={22} /><span>Danh mục</span></Link>
      <Link href="/cart"><ShoppingCart size={22} /><span>Giỏ hàng</span></Link>
      <Link href="/account"><User size={22} /><span>Tài khoản</span></Link>
    </div>
  );
}

/* ============================================
   MAIN PAGE
   ============================================ */
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageFallback() {
  return (
    <div className="pg-page">
      <Header search="" setSearch={() => {}} onSearch={() => {}} />
      <main className="pg-container pg-main">
        <div className="pg-loading-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="pg-skeleton" />)}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sort, setSort] = useState('sold');
  const [search, setSearch] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => { setSearch(searchQuery); }, [searchQuery]);

  useEffect(() => {
    api<{ data: Category[] }>('/api/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (searchQuery) params.set('search', searchQuery);
    params.set('sort', sort);
    api<{ data: Product[] }>(`/api/products?${params}`).then(r => {
      setProducts(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [categorySlug, searchQuery, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = () => {
    if (search.trim()) window.location.href = `/products?search=${encodeURIComponent(search.trim())}`;
  };

  const activeCategory = categories.find(c => c.slug === categorySlug);
  const pageTitle = activeCategory ? activeCategory.name : (searchQuery ? `Kết quả: "${searchQuery}"` : 'TẤT CẢ SẢN PHẨM');

  return (
    <div className="pg-page">
      <Header search={search} setSearch={setSearch} onSearch={handleSearch} />
      <NavBar categorySlug={categorySlug} categories={categories} />

      <main className="pg-container pg-main">
        <div className="pg-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <ChevronRight size={14} />
          {activeCategory ? (
            <Link href="/products">Sản phẩm</Link>
          ) : null}
          {activeCategory && <><ChevronRight size={14} /><span>{activeCategory.name}</span></>}
          {!activeCategory && <span>Sản phẩm</span>}
        </div>

        <div className="pg-toolbar">
          <div className="pg-toolbar-left">
            <h1>{pageTitle}</h1>
            <span className="pg-toolbar-count">{products.length} sản phẩm</span>
          </div>
          <div className="pg-toolbar-right">
            <button className="pg-filter-btn" onClick={() => setShowFilter(!showFilter)}>
              <Filter size={16} /> Lọc
            </button>
            <div className="pg-sort-select">
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {showFilter && (
          <div className="pg-filter-panel">
            <h3>Danh mục</h3>
            <div className="pg-filter-chips">
              <Link href="/products" className={!categorySlug ? 'active' : ''}>Tất cả</Link>
              {categories.map(c => (
                <Link key={c.id} href={`/products?category=${c.slug}`} className={c.slug === categorySlug ? 'active' : ''}>{c.name}</Link>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="pg-loading-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="pg-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="pg-empty">
            <Search size={48} strokeWidth={1} color="#c0c8d4" />
            <h3>Không tìm thấy sản phẩm nào</h3>
            <p>Thử thay đổi từ khóa hoặc danh mục khác.</p>
            <Link href="/products" className="pg-cta">Xem tất cả sản phẩm</Link>
          </div>
        ) : (
          <div className="pg-product-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
