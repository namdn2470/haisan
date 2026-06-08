'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Filter, Search } from 'lucide-react';
import SiteShell from '@/components/shared/SiteShell';
import ProductCard from '@/components/shared/ProductCard';
import { getCategories, getProducts } from '@/services';

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
  { value: 'price-asc', label: 'Giá thấp - cao' },
  { value: 'price-desc', label: 'Giá cao - thấp' },
  { value: 'newest', label: 'Mới nhất' },
];

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
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSort(sortQuery);
  }, [sortQuery]);

  useEffect(() => {
    setLoading(true);
    getProducts({
      category: categorySlug || undefined,
      search: searchQuery || undefined,
      sort,
    }).then(data => {
      setProducts(data as Product[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [categorySlug, searchQuery, sort]);

  const activeCategory = categories.find(c => c.slug === categorySlug);
  const pageTitle = activeCategory ? activeCategory.name : (searchQuery ? `Kết quả: "${searchQuery}"` : 'Tất cả sản phẩm');

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
            <p>{products.length} sản phẩm tươi ngon được tuyển chọn trong ngày</p>
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
          <div className="hs-products-grid">{[...Array(8)].map((_, i) => <div key={i} className="hs-product-skeleton" />)}</div>
        ) : products.length === 0 ? (
          <div className="hs-empty-state">
            <Search size={48} strokeWidth={1.2} />
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Thử thay đổi từ khóa hoặc chọn danh mục khác.</p>
            <Link href="/products" className="hs-btn-primary">Xem tất cả sản phẩm</Link>
          </div>
        ) : (
          <div className="hs-products-grid">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
