// HOME-SECTIONS_ADMIN_PAGE
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save, Search, X, ChevronUp, ChevronDown, Plus,
  AlertCircle, RefreshCw, Eye, EyeOff,
  Package, Trash2,
} from 'lucide-react';
import { useToast } from '../layout-client';
import {
  getHomepageSectionsAdmin,
  upsertHomepageSection,
  type HomeSectionAdmin,
  type HomeSectionItemAdmin,
  type UpsertSectionPayload,
} from '@/services/homepageSectionService';
import { getProductsPage, type Product } from '@/services/productService';
import { money } from '@/lib/money';
import { img } from '@/lib/api';

// ============================================================
// Types
// ============================================================
type SectionSlug = 'today-suggestion' | 'frequently-bought';

type SectionMeta = {
  slug: SectionSlug;
  label: string;
  icon: string;
  hint: string;
  showAddAll?: boolean;
};

const SECTION_META: SectionMeta[] = [
  {
    slug: 'today-suggestion',
    label: 'Gợi ý hôm nay',
    icon: '✨',
    hint: 'Hiển thị trong sidebar bên phải trên trang chủ',
    showAddAll: false,
  },
  {
    slug: 'frequently-bought',
    label: 'Thường mua cùng',
    icon: '🛒',
    hint: 'Combo sản phẩm hiển thị trên trang chủ',
    showAddAll: true,
  },
];

// ============================================================
// Product Search Modal
// ============================================================
function ProductSearchModal({
  onClose,
  onAdd,
  excludeIds,
}: {
  onClose: () => void;
  onAdd: (product: Product) => void;
  excludeIds: string[];
}) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const result = await getProductsPage({
        search: q,
        page: p,
        limit: 12,
      });
      setProducts(result.products);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts('', 1);
  }, [fetchProducts]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts(value, 1);
    }, 400);
  };

  const availableProducts = products.filter(
    (p) => !excludeIds.includes(p.id),
  );

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Chọn sản phẩm
          </h3>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              autoFocus
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 10,
                paddingBottom: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: '#0891b2' }} />
            </div>
          ) : availableProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 14 }}>
              Không tìm thấy sản phẩm phù hợp
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { onAdd(product); onClose(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#0891b2';
                    (e.currentTarget as HTMLButtonElement).style.background = '#ecfeff';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                    (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                  }}
                >
                  <img
                    src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')}
                    alt={product.name}
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: 'cover',
                      borderRadius: 8,
                      flexShrink: 0,
                      background: '#e2e8f0',
                    }}
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (!t.dataset.fallback) {
                        t.dataset.fallback = '1';
                        t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=100';
                      }
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 600 }}>
                      {money(product.basePrice)}<small>/{product.unit}</small>
                    </div>
                  </div>
                  <Plus size={16} style={{ color: '#0891b2', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            padding: 12,
            borderTop: '1px solid #f1f5f9',
          }}>
            <button
              onClick={() => { const p = page - 1; if (p >= 1) { setPage(p); fetchProducts(search, p); } }}
              disabled={page <= 1}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, background: '#fff' }}
            >
              ←
            </button>
            <span style={{ padding: '6px 8px', fontSize: 13, color: '#64748b' }}>
              {page}/{totalPages}
            </span>
            <button
              onClick={() => { const p = page + 1; if (p <= totalPages) { setPage(p); fetchProducts(search, p); } }}
              disabled={page >= totalPages}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, background: '#fff' }}
            >
              →
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================
// Selected Product Item
// ============================================================
function SelectedProductItem({
  item,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: HomeSectionItemAdmin;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const product = item.product;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: '#64748b',
        flexShrink: 0,
      }}>
        {index + 1}
      </div>
      <img
        src={product.images?.[0]?.imageUrl || img('prod-tom.jpg')}
        alt={product.name}
        style={{
          width: 44,
          height: 44,
          objectFit: 'cover',
          borderRadius: 8,
          flexShrink: 0,
          background: '#f1f5f9',
        }}
        onError={(e) => {
          const t = e.currentTarget as HTMLImageElement;
          if (!t.dataset.fallback) {
            t.dataset.fallback = '1';
            t.src = 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=100';
          }
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#0f172a',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.name}
        </div>
        <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 600 }}>
          {money(Number(product.basePrice))}<small>/{product.unit}</small>
        </div>
      </div>
      {product.status !== 'ACTIVE' && (
        <span style={{
          fontSize: 10,
          padding: '2px 6px',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: 4,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {product.status === 'INACTIVE' ? 'Tắt' : 'Hết hàng'}
        </span>
      )}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={iconBtnStyle(index === 0)}
          title="Di chuyển lên"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={iconBtnStyle(index === total - 1)}
          title="Di chuyển xuống"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={onRemove}
          style={{ ...iconBtnStyle(false), color: '#dc2626' }}
          title="Xóa"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Section Editor
// ============================================================
function SectionEditor({
  section,
  meta,
  onSave,
  saving,
}: {
  section: HomeSectionAdmin;
  meta: SectionMeta;
  onSave: (payload: UpsertSectionPayload) => void;
  saving: boolean;
}) {
  const [enabled, setEnabled] = useState(section.enabled);
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle ?? '');
  const [description, setDescription] = useState(section.description ?? '');
  const [ctaText, setCtaText] = useState(section.ctaText ?? '');
  const [ctaUrl, setCtaUrl] = useState(section.ctaUrl ?? '');
  const [maxItems, setMaxItems] = useState(section.maxItems);
  const [items, setItems] = useState<HomeSectionItemAdmin[]>(section.items);
  const [showSearch, setShowSearch] = useState(false);

  // Sync when section changes
  useEffect(() => {
    setEnabled(section.enabled);
    setTitle(section.title);
    setSubtitle(section.subtitle ?? '');
    setDescription(section.description ?? '');
    setCtaText(section.ctaText ?? '');
    setCtaUrl(section.ctaUrl ?? '');
    setMaxItems(section.maxItems);
    setItems(section.items);
  }, [section]);

  const hasChanges = useMemo(() => {
    return (
      enabled !== section.enabled ||
      title !== section.title ||
      subtitle !== (section.subtitle ?? '') ||
      description !== (section.description ?? '') ||
      ctaText !== (section.ctaText ?? '') ||
      ctaUrl !== (section.ctaUrl ?? '') ||
      maxItems !== section.maxItems ||
      items.length !== section.items.length ||
      items.some((item, i) => {
        const orig = section.items[i];
        return !orig || item.productId !== orig.productId || item.sortOrder !== orig.sortOrder;
      })
    );
  }, [enabled, title, subtitle, description, ctaText, ctaUrl, maxItems, items, section]);

  const handleSave = () => {
    onSave({
      enabled,
      title,
      subtitle: subtitle || undefined,
      description: description || undefined,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      maxItems,
      items: items.map((item, idx) => ({ productId: item.productId, sortOrder: idx })),
    });
  };

  const addProduct = (product: Product) => {
    const newItem: HomeSectionItemAdmin = {
      id: `new-${product.id}-${Date.now()}`,
      sectionId: section.id,
      productId: product.id,
      sortOrder: items.length,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        oldPrice: product.oldPrice,
        unit: product.unit,
        shortDescription: product.shortDescription,
        badge: product.badge,
        images: product.images ?? [],
        status: 'ACTIVE',
      },
    };
    setItems([...items, newItem]);
  };

  const removeItem = (productId: string) => {
    setItems((prev) =>
      prev.filter((item) => item.productId !== productId),
    );
  };

  const moveItem = (productId: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.productId === productId);
      if (idx === -1) return prev;
      const newItems = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newItems.length) return prev;
      [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
      return newItems;
    });
  };

  const selectedIds = items.map((item) => item.productId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{meta.icon}</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {meta.label}
            </h3>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            {meta.hint}
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: enabled ? '#059669' : '#94a3b8',
            color: '#fff',
          }}
        >
          {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
          {enabled ? 'Đang bật' : 'Đang tắt'}
        </button>
      </div>

      {/* Content Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <InputF label="Tiêu đề" value={title} onChange={setTitle} placeholder="Gợi ý hôm nay" />
        <InputF label="Nhãn phụ (subtitle)" value={subtitle} onChange={setSubtitle} placeholder="Sản phẩm đang bán tốt" />
        <InputF label="Nút CTA - Text" value={ctaText} onChange={setCtaText} placeholder="Xem sản phẩm" />
        <InputF label="Nút CTA - URL" value={ctaUrl} onChange={setCtaUrl} placeholder="/products" />
        <InputF
          label="Số sản phẩm hiển thị tối đa"
          value={String(maxItems)}
          onChange={(v) => setMaxItems(parseInt(v) || 3)}
          type="number"
          placeholder="3"
        />
      </div>

      <div>
        <TextareaF
          label="Mô tả"
          value={description}
          onChange={setDescription}
          placeholder="Mô tả ngắn về section này..."
          rows={2}
        />
      </div>

      {/* Products Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>
              Sản phẩm trong section
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
              Thứ tự hiển thị: thứ tự trong danh sách
            </p>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0e7490')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0891b2')}
          >
            <Plus size={14} />
            Thêm sản phẩm
          </button>
        </div>

        {items.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: '#f8fafc',
            border: '2px dashed #e2e8f0',
            borderRadius: 12,
            color: '#94a3b8',
            fontSize: 13,
          }}>
            <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Chưa có sản phẩm nào. Nhấn &ldquo;Thêm sản phẩm&rdquo; để bắt đầu.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, idx) => (
              <SelectedProductItem
                key={item.id}
                item={item}
                index={idx}
                total={items.length}
                onRemove={() => removeItem(item.productId)}
                onMoveUp={() => moveItem(item.productId, 'up')}
                onMoveDown={() => moveItem(item.productId, 'down')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        paddingTop: 8,
        borderTop: '1px solid #f1f5f9',
      }}>
        {hasChanges && (
          <span style={{ fontSize: 12, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} />
            Có thay đổi chưa lưu
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            background: hasChanges ? '#0891b2' : '#f1f5f9',
            color: hasChanges ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            if (hasChanges) (e.currentTarget as HTMLButtonElement).style.background = '#0e7490';
          }}
          onMouseLeave={(e) => {
            if (hasChanges) (e.currentTarget as HTMLButtonElement).style.background = '#0891b2';
          }}
        >
          <Save size={15} />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {showSearch && (
        <ProductSearchModal
          onClose={() => setShowSearch(false)}
          onAdd={addProduct}
          excludeIds={selectedIds}
        />
      )}
    </div>
  );
}

// ============================================================
// Field Helpers
// ============================================================
function InputF({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#0891b2')}
        onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = '#e2e8f0')}
      />
    </div>
  );
}

function TextareaF({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 14,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#0891b2')}
        onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#e2e8f0')}
      />
    </div>
  );
}

// ============================================================
// Styles
// ============================================================
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 600,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #f1f5f9',
};

const closeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 8,
  background: '#f1f5f9',
  cursor: 'pointer',
  color: '#475569',
  transition: 'background 0.15s',
};

const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  background: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#cbd5e1' : '#475569',
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.15s',
});

// ============================================================
// Main Page
// ============================================================
export default function HomeSectionsPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [activeSlug, setActiveSlug] = useState<SectionSlug>('today-suggestion');
  const [sections, setSections] = useState<HomeSectionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [savingSlug, setSavingSlug] = useState<SectionSlug | null>(null);

  const loadSections = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await getHomepageSectionsAdmin();
      setSections(data);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const activeSection = useMemo(
    () => sections.find((s) => s.slug === activeSlug),
    [sections, activeSlug],
  );
  const activeMeta = SECTION_META.find((m) => m.slug === activeSlug)!;

  const handleSave = async (slug: SectionSlug, payload: UpsertSectionPayload) => {
    setSavingSlug(slug);
    try {
      const updated = await upsertHomepageSection(slug, payload);
      setSections((prev) =>
        prev.map((s) => (s.slug === slug ? updated : s)),
      );
      toastRef.current.success('Đã lưu cấu hình thành công');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu cấu hình';
      toastRef.current.error(msg);
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Cấu hình trang chủ</h2>
          <p>Quản lý nội dung hiển thị trên trang chủ website</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Section Tabs */}
        <div style={{
          width: 200,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {SECTION_META.map((meta) => {
            const sec = sections.find((s) => s.slug === meta.slug);
            const isActive = activeSlug === meta.slug;
            return (
              <button
                key={meta.slug}
                onClick={() => setActiveSlug(meta.slug)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '14px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  border: 'none',
                  borderLeft: '3px solid',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  background: isActive ? '#ecfeff' : 'transparent',
                  color: isActive ? '#0891b2' : '#475569',
                  borderLeftColor: isActive ? '#0891b2' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1.4 }}>{meta.icon}</span>
                <div>
                  <div style={{ lineHeight: 1.3 }}>{meta.label}</div>
                  {sec && !sec.enabled && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Đang tắt</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Editor Area */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: 24,
          minHeight: 600,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#0891b2' }} />
            </div>
          ) : fetchError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 80 }}>
              <AlertCircle size={32} style={{ color: '#f87171' }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>Không thể tải cấu hình trang chủ</p>
              <button
                onClick={loadSections}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                <RefreshCw size={14} />
                Thử lại
              </button>
            </div>
          ) : !activeSection ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 80 }}>
              <Package size={40} style={{ color: '#cbd5e1' }} />
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Chưa có cấu hình cho section này. Lưu lần đầu để tạo.</p>
              <button
                onClick={() => handleSave(activeSlug, { title: activeMeta.label, enabled: true })}
                disabled={savingSlug !== null}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                <Save size={14} />
                Tạo mới
              </button>
            </div>
          ) : (
            <SectionEditor
              key={activeSection.id}
              section={activeSection}
              meta={activeMeta}
              onSave={(payload) => handleSave(activeSlug, payload)}
              saving={savingSlug === activeSlug}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
