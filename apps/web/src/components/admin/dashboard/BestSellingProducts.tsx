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

const RANK_COLORS = ['#f59e0b', '#64748b', '#d97706', '#64748b'];

export default function BestSellingProducts({ products }: BestSellingProductsProps) {
  const items = products && products.length > 0 ? products : null;

  return (
    <div className="adm-card adm-best-products-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Sản phẩm bán chạy
        </h3>
        <Link
          href="/admin/products"
          style={{
            fontSize: 12,
            color: '#0891b2',
            textDecoration: 'none',
          }}
        >
          Xem tất cả
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!items ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
            Chưa có dữ liệu bán chạy
          </p>
        ) : items.map((product) => (
          <div key={product.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px',
            borderRadius: 8,
          }}>
            {/* Rank badge */}
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: RANK_COLORS[product.rank - 1] || '#64748b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {product.rank}
            </div>

            {/* Product image placeholder */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f1f5f9',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>

            {/* Product info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {product.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Đã bán: <span style={{ fontWeight: 600, color: '#059669' }}>{product.sold} kg</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
