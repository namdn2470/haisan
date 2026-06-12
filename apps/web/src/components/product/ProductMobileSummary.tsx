'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { money } from '@/lib/money';

type Variant = {
  id: string;
  name: string;
  sizeLabel?: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  sku: string;
  isActive?: boolean;
  minWeight?: string;
  maxWeight?: string;
};

type ProcessingOption = {
  processingService: {
    id: string;
    name: string;
    price: number;
    description?: string;
  };
};

const DELIVERY_SLOTS = [
  { value: 'today-16-18', label: 'Hôm nay 16:00 - 18:00' },
  { value: 'today-18-20', label: 'Hôm nay 18:00 - 20:00' },
  { value: 'tomorrow-08-10', label: 'Ngày mai 08:00 - 10:00' },
  { value: 'tomorrow-14-16', label: 'Ngày mai 14:00 - 16:00' },
];

function unitLabel(unit: string) {
  return unit ? unit.toUpperCase() : 'KG';
}

export default function ProductMobileSummary({
  name,
  categoryName,
  badgeLabel,
  isFreshLive,
  ratingAvg,
  ratingCount,
  soldCount,
  shortDescription,
  currentPrice,
  oldPrice,
  selectedUnit,
  unitOptions,
  onUnitChange,
  status,
  availableQuantity,
  canPurchase,
  variants,
  selectedVariant,
  onSelectVariant,
  qty,
  onQtyChange,
  processingOptions,
  selectedProcessing,
  onProcessingChange,
  deliverySlot,
  onDeliverySlotChange,
  onAddToCart,
  onBuyNow,
  adding,
}: {
  name: string;
  categoryName?: string;
  badgeLabel?: string;
  isFreshLive?: boolean;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  shortDescription?: string | null;
  currentPrice: number;
  oldPrice: number;
  selectedUnit: string;
  unitOptions: string[];
  onUnitChange: (u: string) => void;
  status: string;
  availableQuantity: number;
  canPurchase: boolean;
  variants?: Variant[];
  selectedVariant: Variant | null;
  onSelectVariant: (v: Variant) => void;
  qty: number;
  onQtyChange: (q: number) => void;
  processingOptions?: ProcessingOption[];
  selectedProcessing: string;
  onProcessingChange: (id: string) => void;
  deliverySlot: string;
  onDeliverySlotChange: (s: string) => void;
  onAddToCart: () => void | Promise<void>;
  onBuyNow: () => void | Promise<void>;
  adding: boolean;
}) {
  const hasRating = Number(ratingAvg || 0) > 0;
  const roundedRating = Math.round(Number(ratingAvg || 0));
  const activeVariants = (variants || []).filter(v => v.isActive !== false);
  const stockText = status === 'ACTIVE' && availableQuantity > 0 ? `Còn ${availableQuantity}` : 'Hết hàng';
  const discountPercent = oldPrice > currentPrice
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;

  const processingFee = useMemo(() => {
    return Number(
      processingOptions?.find(o => o.processingService.id === selectedProcessing)
        ?.processingService.price || 0
    );
  }, [processingOptions, selectedProcessing]);

  const totalPrice = (currentPrice + processingFee) * qty;

  return (
    <section className="pd-mobile-card pd-mobile-summary">
      <div className="pd-mobile-badges">
        {categoryName && <span className="pd-chip pd-chip-blue">{categoryName}</span>}
        {badgeLabel && <span className="pd-chip pd-chip-sale">{badgeLabel}</span>}
        {isFreshLive && <span className="pd-chip pd-chip-green">Tươi sống</span>}
      </div>

      <h1>{name}</h1>

      <div className="pd-mobile-rating">
        {hasRating ? (
          <div className="pd-stars" aria-label={`${Number(ratingAvg).toFixed(1)} sao`}>
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                size={14}
                fill={s <= roundedRating ? '#f59e0b' : 'none'}
                stroke={s <= roundedRating ? '#f59e0b' : '#cbd5e1'}
              />
            ))}
            <b>{Number(ratingAvg).toFixed(1)}</b>
            <span>({ratingCount})</span>
          </div>
        ) : (
          <span>Chưa có đánh giá</span>
        )}
        {soldCount > 0 && (
          <>
            <i aria-hidden="true" />
            <span>Đã bán {soldCount}+</span>
          </>
        )}
      </div>

      <div className="pd-mobile-price-row">
        <p className="pd-mobile-price">
          {money(currentPrice)}
          <span>/{unitLabel(selectedUnit)}</span>
        </p>
        {discountPercent > 0 && <span className="pd-discount">-{discountPercent}%</span>}
      </div>
      {oldPrice > currentPrice && (
        <div className="pd-mobile-old-price">
          <del>{money(oldPrice)}</del>
          <span>Giá tốt hôm nay</span>
        </div>
      )}

      <div className="pd-mobile-stock">
        <span className={canPurchase ? 'available' : 'unavailable'}>
          <CheckCircle2 size={15} /> {stockText}
        </span>
        <i aria-hidden="true" />
        <span>Giao nhanh 2h</span>
        <i aria-hidden="true" />
        <span>Đơn vị {unitLabel(selectedUnit)}</span>
      </div>

      {shortDescription && <p className="pd-mobile-short-desc">{shortDescription}</p>}

      {activeVariants.length > 0 && (
        <div className="pd-mobile-field">
          <label>Chọn size</label>
          <div className="pd-mobile-size-grid">
            {activeVariants.map(v => (
              <button
                key={v.id}
                type="button"
                className={selectedVariant?.id === v.id ? 'active' : ''}
                onClick={() => onSelectVariant(v)}
              >
                <b>{v.name}</b>
                {v.minWeight && v.maxWeight && <small>{v.minWeight}-{v.maxWeight}kg</small>}
                <small>{money(Number(v.price))}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pd-mobile-purchase-grid">
        <div className="pd-mobile-field">
          <label>Số lượng</label>
          <div className="pd-mobile-qty">
            <button
              type="button"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              aria-label="Giảm số lượng"
            >
              <Minus size={15} />
            </button>
            <span>{qty}</span>
            <button
              type="button"
              onClick={() => onQtyChange(Math.min(qty + 1, availableQuantity || qty + 1))}
              disabled={availableQuantity > 0 && qty >= availableQuantity}
              aria-label="Tăng số lượng"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="pd-mobile-field">
          <label>Đơn vị</label>
          <div className="pd-mobile-unit">
            {unitOptions.map(u => (
              <button
                key={u}
                type="button"
                className={selectedUnit === u ? 'active' : ''}
                onClick={() => onUnitChange(u)}
              >
                {unitLabel(u)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {processingOptions && processingOptions.length > 0 && (
        <div className="pd-mobile-field">
          <label>Chế biến</label>
          <div className="pd-mobile-chip-scroll">
            <button
              type="button"
              className={selectedProcessing === '' ? 'active' : ''}
              onClick={() => onProcessingChange('')}
            >
              Để sống
            </button>
            {processingOptions.map(opt => (
              <button
                key={opt.processingService.id}
                type="button"
                className={selectedProcessing === opt.processingService.id ? 'active' : ''}
                onClick={() => onProcessingChange(opt.processingService.id)}
              >
                {opt.processingService.name}
                {Number(opt.processingService.price) > 0 && (
                  <small>+{money(Number(opt.processingService.price))}</small>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pd-mobile-delivery">
        <Clock size={18} />
        <div>
          <b>Giao nhanh trong ngày</b>
          <select value={deliverySlot} onChange={e => onDeliverySlotChange(e.target.value)}>
            {DELIVERY_SLOTS.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pd-mobile-total">
        <span>Thành tiền</span>
        <b>{money(totalPrice)}</b>
      </div>

      <div className="pd-mobile-cta-row">
        <button
          type="button"
          className="pd-mobile-cart-cta"
          onClick={onAddToCart}
          disabled={adding || !canPurchase}
        >
          <ShoppingCart size={18} />
          {adding ? 'Đang thêm...' : canPurchase ? 'Thêm vào giỏ' : 'Hết hàng'}
        </button>
        <button
          type="button"
          className="pd-mobile-buy-cta"
          onClick={onBuyNow}
          disabled={adding || !canPurchase}
        >
          Mua ngay
        </button>
      </div>
    </section>
  );
}
