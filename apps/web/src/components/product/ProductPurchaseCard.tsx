'use client';

import { useMemo } from 'react';
import { Minus, Plus, ShoppingCart, Clock, CheckCircle2, RotateCcw, ShieldCheck, MessageCircle } from 'lucide-react';
import { money } from '@/lib/money';

type Variant = {
  id: string; name: string; sizeLabel?: string; price: number;
  oldPrice?: number; stockQuantity: number; sku: string; isActive?: boolean;
  minWeight?: string; maxWeight?: string;
};

type ProcessingOption = {
  processingService: { id: string; name: string; price: number; description?: string };
};

type InventoryItem = { quantity: string | number; reservedQuantity?: string | number };

const UNIT_OPTIONS = ['kg', 'con'];
const DELIVERY_SLOTS = [
  { value: 'today-16-18', label: 'Hôm nay 16:00 - 18:00' },
  { value: 'today-18-20', label: 'Hôm nay 18:00 - 20:00' },
  { value: 'tomorrow-08-10', label: 'Ngày mai 08:00 - 10:00' },
  { value: 'tomorrow-14-16', label: 'Ngày mai 14:00 - 16:00' },
];

export default function ProductPurchaseCard({
  basePrice,
  oldPrice: productOldPrice,
  inventory,
  processingOptions,
  status,
  selectedVariant,
  qty,
  onQtyChange,
  selectedUnit,
  onUnitChange,
  selectedProcessing,
  onProcessingChange,
  deliverySlot,
  onDeliverySlotChange,
  onAddToCart,
  onBuyNow,
  adding,
}: {
  basePrice: number;
  oldPrice?: number | null;
  inventory?: InventoryItem[];
  processingOptions?: ProcessingOption[];
  status: string;
  selectedVariant: Variant | null;
  qty: number;
  onQtyChange: (q: number) => void;
  selectedUnit: string;
  onUnitChange: (u: string) => void;
  selectedProcessing: string;
  onProcessingChange: (id: string) => void;
  deliverySlot: string;
  onDeliverySlotChange: (s: string) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  adding: boolean;
}) {
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(basePrice);
  const oldPrice = selectedVariant?.oldPrice ? Number(selectedVariant.oldPrice) : (productOldPrice ? Number(productOldPrice) : 0);

  const processingFee = useMemo(() => {
    return Number(processingOptions?.find(o => o.processingService.id === selectedProcessing)?.processingService.price || 0);
  }, [processingOptions, selectedProcessing]);

  const totalPrice = (currentPrice + processingFee) * qty;

  const availableQuantity = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.stockQuantity || 0);
    return (inventory || []).reduce((sum, item) => {
      return sum + Number(item.quantity || 0) - Number(item.reservedQuantity || 0);
    }, 0);
  }, [selectedVariant, inventory]);

  const canPurchase = status === 'ACTIVE' && availableQuantity > 0;

  const variantWeight = useMemo(() => {
    if (!selectedVariant) return '';
    if (selectedVariant.minWeight && selectedVariant.maxWeight) {
      return `${selectedVariant.minWeight} - ${selectedVariant.maxWeight} kg/con`;
    }
    return selectedVariant.sizeLabel || '';
  }, [selectedVariant]);

  return (
    <div className="buy-card">
      <label>Giá bán</label>
      <div className="detail-price">
        {money(currentPrice)}<small>/{selectedUnit}</small>
        {oldPrice > 0 && <del style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', marginLeft: 8 }}>{money(oldPrice)}</del>}
      </div>

      <div className="buy-line">
        <b>Số lượng</b>
        <div className="qty">
          <button onClick={() => onQtyChange(Math.max(1, qty - 1))} disabled={qty <= 1}><Minus size={15} /></button>
          <span>{qty}</span>
          <button onClick={() => onQtyChange(Math.min(qty + 1, availableQuantity || qty + 1))} disabled={availableQuantity > 0 && qty >= availableQuantity}><Plus size={15} /></button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Đơn vị</label>
        <div className="chip-grid">
          {UNIT_OPTIONS.map(u => (
            <button key={u} className={selectedUnit === u ? 'active' : ''} onClick={() => onUnitChange(u)}>{u}</button>
          ))}
        </div>
      </div>

      {variantWeight && (
        <div className="buy-line">
          <span>Ước tính</span>
          <b>{variantWeight}</b>
        </div>
      )}

      <div className="buy-row">
        <b>Thành tiền</b>
        <b className="red">{money(totalPrice)}</b>
      </div>

      <button className="cart-cta" onClick={onAddToCart} disabled={adding || !canPurchase}>
        <ShoppingCart size={18} /> {adding ? 'Đang thêm...' : (canPurchase ? 'THÊM VÀO GIỎ' : 'HẾT HÀNG')}
      </button>
      <button className="buy-cta" onClick={onBuyNow} disabled={adding || !canPurchase}>
        MUA NGAY <small style={{ fontWeight: 500, opacity: 0.8, marginLeft: 4 }}>Giao nhanh 2h</small>
      </button>

      {processingOptions && processingOptions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Chế biến</label>
          <div className="chip-grid">
            <button className={selectedProcessing === '' ? 'active' : ''} onClick={() => onProcessingChange('')}>Để sống</button>
            {processingOptions.map(opt => (
              <button
                key={opt.processingService.id}
                className={selectedProcessing === opt.processingService.id ? 'active' : ''}
                onClick={() => onProcessingChange(opt.processingService.id)}
              >
                {opt.processingService.name}
                {Number(opt.processingService.price) > 0 && <small> +{money(Number(opt.processingService.price))}</small>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: 'var(--green-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={18} />
        <div>
          <div>Giao nhanh trong ngày</div>
          <select
            value={deliverySlot}
            onChange={e => onDeliverySlotChange(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13, color: 'var(--green)', cursor: 'pointer', padding: 0 }}
          >
            {DELIVERY_SLOTS.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: <CheckCircle2 size={15} />, text: 'Miễn phí giao đơn từ 500k' },
          { icon: <RotateCcw size={15} />, text: 'Đổi trả nếu không tươi' },
          { icon: <ShieldCheck size={15} />, text: 'Cam kết đúng hàng' },
          { icon: <MessageCircle size={15} />, text: 'Tư vấn 24/7' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--green)' }}>{t.icon}</span> {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
