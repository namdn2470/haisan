'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown, ChevronRight, Filter, Search,
  LayoutGrid, LayoutList, Star, ShoppingCart,
} from 'lucide-react';

import ProductCard from '@/components/shared/ProductCard';
import { getCategories, getProductsPage } from '@/services';
import { useCart } from '@/lib/cart-store';
import { img } from '@/lib/api';
import { money } from '@/lib/money';

type Category = { id: string; name: string; slug: string; imageUrl?: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  oldPrice?: number;
  unit: string;
  badge?: string;
  ratingAvg: number;
  soldCount: number;
  shortDescription?: string;
  images?: { imageUrl: string }[];
  category?: { name: string };
};

const SORT_OPTIONS = [
  { value: 'best-selling', label: 'Bán chạy' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá thấp - cao' },
  { value: 'price-desc', label: 'Giá cao - thấp' },
];

const BADGE_MAP: Record<string, string> = {
  BAN_CHAY: 'Bán chạy',
  UU_DAI: 'Ưu đãi',
  TUOI_NGON: 'Tươi ngon',
  MOI: 'Mới',
};

const LIMIT = 24;

/* ── List-view card (mobile) ── */
function ProductListCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
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

  const imageUrl = product.images?.[0]?.imageUrl;
  const badgeLabel = product.badge ? (BADGE_MAP[product.badge] || product.badge) : null;

  return (
    <article className="pp-lcard">
      <Link href={`/products/${product.slug}`} className="pp-lcard-img-wrap">
        <img
          src={imageUrl || img('prod-tom.jpg')}
          alt={product.name}
          onError={(e) => {
            const t = e.currentTarget;
            if (!t.dataset.fallback) {
              t.dataset.fallback = 'true';
              t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=200';
            }
          }}
        />
        {badgeLabel && <span className="pp-lcard-badge">{badgeLabel}</span>}
      </Link>
      <div className="pp-lcard-body">
        <Link href={`/products/${product.slug}`} className="pp-lcard-name">
          {product.name}
        </Link>
        <span className="pp-lcard-spec">
          {product.shortDescription || `/${product.unit}`}
        </span>
        <div className="pp-lcard-rating">
          <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
          <span>{Number(product.ratingAvg ?? 4.8).toFixed(1)}</span>
          <small>({product.soldCount ?? 0})</small>
        </div>
        <div className="pp-lcard-footer">
          <div>
            <span className="pp-lcard-price">
              {money(Number(product.basePrice))}<small>/{product.unit}</small>
            </span>
            {product.oldPrice && (
              <del className="pp-lcard-old">{money(Number(product.oldPrice))}</del>
            )}
          </div>
          <button
            className="pp-lcard-cart"
            onClick={handleAddToCart}
            disabled={adding}
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Page skeleton ── */
function ProductsLoading() {
  return (
    <main className="hs-container hs-page-main">
      <div className="hs-products-grid">
        {[...Array(8)].map((_, i) => <div key={i} className="hs-product-skeleton" />)}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

/* ── Main page content ── */
function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortQuery = searchParams.get('sort') || 'best-selling';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sort, setSort] = useState(sortQuery);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSort(sortQuery);
  }, [sortQuery]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [categorySlug, searchQuery, sort]);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    getProductsPage({
      category: categorySlug || undefined,
      search: searchQuery || undefined,
      sort,
      page,
      limit: LIMIT,
    }).then(result => {
      if (cancelled) return;
      if (page === 1) setProducts(result.products as Product[]);
      else setProducts(prev => [...prev, ...(result.products as Product[])]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
      setLoadingMore(false);
    }).catch(() => {
      if (!cancelled) { setLoading(false); setLoadingMore(false); }
    });

    return () => { cancelled = true; };
  }, [categorySlug, searchQuery, sort, page]);

  const activeCategory = categories.find(c => c.slug === categorySlug);
  const pageTitle = activeCategory
    ? activeCategory.name
    : searchQuery
      ? `Kết quả: "${searchQuery}"`
      : 'Tất cả sản phẩm';

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <main className="hs-container hs-page-main">
      {/* Breadcrumb — shown on both mobile and desktop */}
      <div className="hs-breadcrumb">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={14} />
        {activeCategory ? <Link href="/products">Sản phẩm</Link> : <span>Sản phẩm</span>}
        {activeCategory && <><ChevronRight size={14} /><span>{activeCategory.name}</span></>}
      </div>

      {/* Desktop toolbar (hidden on mobile) */}
      <section className="hs-page-toolbar pp-desktop-only">
        <div>
          <h1>{pageTitle}</h1>
          <p>
            {loading
              ? 'Đang tải...'
              : total > 0
                ? `${total} sản phẩm tươi ngon được tuyển chọn trong ngày`
                : 'Không tìm thấy sản phẩm'}
          </p>
        </div>
        <div className="hs-toolbar-actions">
          <button className="hs-filter-btn" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Lọc
          </button>
          <label className="hs-sort-select">
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={16} />
          </label>
        </div>
      </section>

      {/* Mobile header (hidden on desktop) */}
      <div className="pp-mob-head pp-mob-only">
        <h1 className="pp-mob-title">{pageTitle}</h1>
        <p className="pp-mob-count">
          {loading ? 'Đang tải...' : `${total} sản phẩm`}
        </p>
      </div>

      {/* Mobile toolbar: filter + sort + view toggle (hidden on desktop) */}
      <div className="pp-mob-toolbar pp-mob-only">
        <button
          className={`pp-mob-filter-btn${showFilter ? ' active' : ''}`}
          onClick={() => setShowFilter(!showFilter)}
        >
          <Filter size={15} />
          Lọc{showFilter ? ' ▴' : ''}
        </button>

        <label className="pp-mob-sort-wrap">
          <select value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} />
        </label>

        <div className="pp-view-toggle">
          <button
            className={`pp-view-btn${viewMode === 'grid' ? ' pp-view-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Chế độ grid"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`pp-view-btn${viewMode === 'list' ? ' pp-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="Chế độ danh sách"
          >
            <LayoutList size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel (shared, shown when toggled) */}
      {showFilter && (
        <section className="hs-filter-panel">
          <h2>Danh mục</h2>
          <div className="hs-filter-chips">
            <Link href="/products" className={!categorySlug ? 'active' : ''}>Tất cả</Link>
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className={category.slug === categorySlug ? 'active' : ''}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {loading ? (
        <div className="hs-products-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="hs-product-skeleton" />)}
        </div>
      ) : safeProducts.length === 0 ? (
        <div className="hs-empty-state">
          <Search size={48} strokeWidth={1.2} />
          <h2>Không tìm thấy sản phẩm</h2>
          <p>Thử thay đổi từ khóa hoặc chọn danh mục khác.</p>
          <Link href="/products" className="hs-btn-primary">Xem tất cả sản phẩm</Link>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="pp-list-view">
              {safeProducts.map(product => (
                <ProductListCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="hs-products-grid">
              {safeProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {page < totalPages && (
            <div className="hs-load-more">
              <button
                className="hs-load-more-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore
                  ? 'Đang tải...'
                  : `Xem thêm ${Math.min(LIMIT, total - safeProducts.length)} sản phẩm`}
              </button>
              <span className="hs-load-more-count">
                Đang xem {safeProducts.length} / {total}
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
