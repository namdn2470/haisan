'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Filter, Search } from 'lucide-react';
import SiteShell from '@/components/shared/SiteShell';
import ProductCard from '@/components/shared/ProductCard';
import { getCategories, getProductsPage } from '@/services';

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

const LIMIT = 24;

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsLoading() {
  return (
    <SiteShell>
      <main className="hs-container hs-page-main">
        <div className="hs-products-grid">{[...Array(8)].map((_, i) => <div key={i} className="hs-product-skeleton" />)}</div>
      </main>
    </SiteShell>
  );
}

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

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSort(sortQuery);
  }, [sortQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [categorySlug, searchQuery, sort]);

  // Load products
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

  return (
    <SiteShell>
      <main className="hs-container hs-page-main">
        <div className="hs-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <ChevronRight size={14} />
          {activeCategory ? <Link href="/products">Sản phẩm</Link> : <span>Sản phẩm</span>}
          {activeCategory && <><ChevronRight size={14} /><span>{activeCategory.name}</span></>}
        </div>

        <section className="hs-page-toolbar">
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

        {showFilter && (
          <section className="hs-filter-panel">
            <h2>Danh mục</h2>
            <div className="hs-filter-chips">
              <Link href="/products" className={!categorySlug ? 'active' : ''}>Tất cả</Link>
              {categories.map(category => (
                <Link key={category.id} href={`/products?category=${category.slug}`} className={category.slug === categorySlug ? 'active' : ''}>
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="hs-products-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="hs-product-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="hs-empty-state">
            <Search size={48} strokeWidth={1.2} />
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Thử thay đổi từ khóa hoặc chọn danh mục khác.</p>
            <Link href="/products" className="hs-btn-primary">Xem tất cả sản phẩm</Link>
          </div>
        ) : (
          <>
            <div className="hs-products-grid">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            {page < totalPages && (
              <div className="hs-load-more">
                <button
                  className="hs-load-more-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? 'Đang tải...'
                    : `Xem thêm ${Math.min(LIMIT, total - products.length)} sản phẩm`}
                </button>
                <span className="hs-load-more-count">
                  Đang xem {products.length} / {total}
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </SiteShell>
  );
}
