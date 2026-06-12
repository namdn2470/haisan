'use client';

import { Minus, Plus, ShoppingCart } from 'lucide-react';

export default function StickyPurchaseBar({
  qty,
  onQtyChange,
  availableQuantity,
  canPurchase,
  adding,
  onAddToCart,
  onBuyNow,
}: {
  qty: number;
  onQtyChange: (q: number) => void;
  availableQuantity: number;
  canPurchase: boolean;
  adding: boolean;
  onAddToCart: () => void | Promise<void>;
  onBuyNow: () => void | Promise<void>;
}) {
  return (
    <div className="pd-sticky-purchase">
      <div className="pd-sticky-inner">
        <div className="pd-sticky-qty" aria-label="Số lượng">
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="Giảm số lượng"
          >
            <Minus size={14} />
          </button>
          <span>{qty}</span>
          <button
            type="button"
            onClick={() => onQtyChange(Math.min(qty + 1, availableQuantity || qty + 1))}
            disabled={availableQuantity > 0 && qty >= availableQuantity}
            aria-label="Tăng số lượng"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          className="pd-sticky-cart"
          onClick={onAddToCart}
          disabled={adding || !canPurchase}
        >
          <ShoppingCart size={16} />
          <span>{adding ? 'Đang thêm' : 'Thêm giỏ'}</span>
        </button>

        <button
          type="button"
          className="pd-sticky-buy"
          onClick={onBuyNow}
          disabled={adding || !canPurchase}
        >
          {canPurchase ? 'Mua ngay' : 'Hết hàng'}
        </button>
      </div>
    </div>
  );
}
