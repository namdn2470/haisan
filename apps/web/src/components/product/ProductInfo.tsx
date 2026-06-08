'use client';

import { Star } from 'lucide-react';
import ProductCommitments from './ProductCommitments';
import ProductMeta from './ProductMeta';

type Variant = {
  id: string; name: string; sizeLabel?: string; price: number;
  oldPrice?: number; stockQuantity: number; sku: string; isActive?: boolean;
  minWeight?: string; maxWeight?: string;
};

export default function ProductInfo({
  name,
  ratingAvg,
  ratingCount,
  soldCount,
  shortDescription,
  origin,
  storageInstruction,
  status,
  variants,
  selectedVariant,
  onSelectVariant,
  availableQuantity,
}: {
  name: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  shortDescription?: string | null;
  origin?: string | null;
  storageInstruction?: string | null;
  status: string;
  variants?: Variant[];
  selectedVariant: Variant | null;
  onSelectVariant: (v: Variant) => void;
  availableQuantity: number;
}) {
  const hasRating = ratingAvg > 0;
  const roundedRating = Math.round(Number(ratingAvg || 0));

  return (
    <div className="detail-info">
      <h1>{name}</h1>

      <div className="detail-rating">
        {hasRating ? (
          <>
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} fill={s <= roundedRating ? '#f59e0b' : 'none'} stroke={s <= roundedRating ? '#f59e0b' : '#d1d5db'} />
            ))}
            <span>{Number(ratingAvg).toFixed(1)} ({ratingCount})</span>
          </>
        ) : (
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>Chưa có đánh giá</span>
        )}
        {soldCount > 0 && (
          <>
            <i />
            <span>Đã bán {soldCount}+</span>
          </>
        )}
      </div>

      <ProductCommitments />

      {shortDescription && (
        <p className="detail-desc">{shortDescription}</p>
      )}

      <ProductMeta
        origin={origin}
        storageInstruction={storageInstruction}
        status={status}
        availableQuantity={availableQuantity}
      />

      {variants && variants.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Chọn size</label>
          <div className="size-grid">
            {variants.filter(v => v.isActive !== false).map(v => (
              <button
                key={v.id}
                className={selectedVariant?.id === v.id ? 'active' : ''}
                onClick={() => onSelectVariant(v)}
              >
                {v.name}
                {v.minWeight && v.maxWeight && <small>{v.minWeight}-{v.maxWeight}kg</small>}
                <small>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v.price))}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
