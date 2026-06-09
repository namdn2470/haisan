'use client';

import Link from 'next/link';

interface BestSeller {
  id: string;
  name: string;
  slug: string;
  rank: number;
  sold: number;
  imageUrl?: string;
}

interface BestSellingProductsProps {
  products?: BestSeller[] | null;
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#d97706', '#94a3b8'];

export default function BestSellingProducts({ products }: BestSellingProductsProps) {
  const items = products && products.length > 0 ? products : null;

  return (
    <div className="db-card rsc-card">
      <div className="rsc-header">
        <h3 className="rsc-title">Sản phẩm bán chạy</h3>
        <Link href="/admin/products" className="rsc-link">Xem tất cả</Link>
      </div>

      <div className="rsc-list">
        {!items ? (
          <div className="rsc-empty">
            <p>Chưa có dữ liệu bán chạy</p>
          </div>
        ) : items.map((product) => (
          <div key={product.id} className="bsp-item">
            <div
              className="bsp-rank"
              style={{ background: RANK_COLORS[product.rank - 1] || '#94a3b8' }}
            >
              {product.rank}
            </div>
            <div className="bsp-image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div className="bsp-info">
              <div className="bsp-name">{product.name}</div>
              <div className="bsp-sold">
                Đã bán: <strong>{product.sold} kg</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
