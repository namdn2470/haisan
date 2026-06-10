// SETTINGS_PAGE_UI_REBUILT
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save, Building2, Phone, Mail, Globe, Link2,
  Facebook, MessageSquare, ImagePlus, AlertCircle,
  RefreshCw, Trash2, ExternalLink,
} from 'lucide-react';
import { useToast } from '../layout-client';
import { fetchSettings, updateSettings } from '@/lib/admin/api';
import { unwrapApiData } from '@/lib/api-response';

type Section = 'store' | 'contact' | 'social' | 'seo';

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'store', label: 'Thông tin cửa hàng', icon: Building2 },
  { id: 'contact', label: 'Liên hệ & Địa chỉ', icon: Phone },
  { id: 'social', label: 'Mạng xã hội', icon: Globe },
  { id: 'seo', label: 'SEO', icon: Link2 },
];

interface StoreSettings {
  id: string;
  storeName: string;
  storeDescription: string | null;
  logo: string | null;
  favicon: string | null;
  taxCode: string | null;
  businessLicense: string | null;
  phone: string | null;
  hotline: string | null;
  email: string | null;
  address: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  mapUrl: string | null;
  openingHours: string | null;
  deliveryPolicy: string | null;
  returnPolicy: string | null;
  defaultShippingFee: number | string;
  defaultShippingZone: string | null;
  facebookUrl: string | null;
  zaloUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
}

function emptySettings(): StoreSettings {
  return {
    id: '',
    storeName: '',
    storeDescription: null,
    logo: null,
    favicon: null,
    taxCode: null,
    businessLicense: null,
    phone: null,
    hotline: null,
    email: null,
    address: null,
    ward: null,
    district: null,
    city: null,
    mapUrl: null,
    openingHours: null,
    deliveryPolicy: null,
    returnPolicy: null,
    defaultShippingFee: 0,
    defaultShippingZone: null,
    facebookUrl: null,
    zaloUrl: null,
    tiktokUrl: null,
    youtubeUrl: null,
    instagramUrl: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImage: null,
  };
}

function normalizeResponse(data: unknown): StoreSettings {
  const raw = unwrapApiData<StoreSettings>(data);
  if (!raw) return emptySettings();
  return {
    ...emptySettings(),
    ...raw,
    defaultShippingFee:
      raw.defaultShippingFee != null
        ? String(raw.defaultShippingFee)
        : '0',
  };
}

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try { new URL(value); return true; } catch { return false; }
}

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ——— Input ———
function InputField({
  label, value, onChange, placeholder, type = 'text',
  icon: Icon, helpText, error, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ElementType;
  helpText?: string; error?: string; required?: boolean;
}) {
  return (
    <div className="adm-form-group">
      <label className="adm-form-label">
        {Icon && <Icon size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`adm-form-input${error ? ' adm-input-error' : ''}`}
      />
      {helpText && !error && <p className="adm-form-hint">{helpText}</p>}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</p>}
    </div>
  );
}

// ——— Textarea ———
function TextareaField({
  label, value, onChange, placeholder, rows = 3,
  helpText, error, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
  helpText?: string; error?: string; maxLength?: number;
}) {
  const charCount = value.length;
  return (
    <div className="adm-form-group">
      <label className="adm-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {maxLength && (
          <span style={{
            fontSize: 11, fontWeight: 400,
            color: charCount > maxLength ? '#ef4444' : '#64748b',
          }}>
            {charCount}/{maxLength}
          </span>
        )}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`adm-textarea${error ? ' adm-input-error' : ''}`}
      />
      {helpText && !error && <p className="adm-form-hint">{helpText}</p>}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</p>}
    </div>
  );
}

// ——— Image URL Input ———
function ImageUrlField({
  label, value, onChange, helpText,
}: {
  label: string; value: string | null; onChange: (v: string | null) => void; helpText?: string;
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleSetUrl = () => {
    if (inputUrl.trim()) {
      onChange(inputUrl.trim());
      setShowInput(false);
      setInputUrl('');
      setPreviewError(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreviewError(false);
  };

  const hasPreview = value && !previewError;

  return (
    <div className="adm-form-group">
      <label className="adm-form-label">{label}</label>

      {hasPreview && (
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          <img
            src={value}
            alt={label}
            onError={() => setPreviewError(true)}
            style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 12, border: '1px solid #e2e8f0', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0,
            transition: 'opacity 0.15s', borderRadius: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            className="img-overlay"
          >
            <button
              type="button"
              onClick={handleRemove}
              style={{ padding: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
              title="Xóa ảnh"
            >
              <Trash2 size={14} />
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: 8, background: '#334155', color: '#fff', borderRadius: '50%', textDecoration: 'none' }}
              title="Mở ảnh"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <style>{`.img-overlay:hover { opacity: 1 !important; }`}</style>
        </div>
      )}

      {previewError && value && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 12, background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, fontSize: 13, color: '#dc2626',
        }}>
          <AlertCircle size={14} />
          <span style={{ flex: 1 }}>Không thể tải ảnh từ URL này.</span>
          <button type="button" onClick={handleRemove} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
            Xóa
          </button>
        </div>
      )}

      {!value && !showInput && (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '32px 16px', width: '100%',
            border: '2px dashed #cbd5e1', borderRadius: 16,
            background: '#f8fafc', cursor: 'pointer',
            transition: 'all 0.15s', color: '#64748b',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#0891b2';
            (e.currentTarget as HTMLButtonElement).style.background = '#ecfeff';
            (e.currentTarget as HTMLButtonElement).style.color = '#0891b2';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
            (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImagePlus size={20} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Nhấn để nhập URL ảnh</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>PNG, JPG, WEBP</div>
        </button>
      )}

      {showInput && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: 16, background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 12,
        }}>
          <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Nhập URL ảnh</p>
          <input
            type="url"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSetUrl();
              if (e.key === 'Escape') setShowInput(false);
            }}
            placeholder="https://example.com/image.jpg"
            autoFocus
            className="adm-form-input"
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowInput(false)}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 500,
                color: '#475569', background: 'transparent',
                border: '1px solid #e2e8f0', borderRadius: 10,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSetUrl}
              disabled={!inputUrl.trim()}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 500,
                color: '#fff', background: inputUrl.trim() ? '#0891b2' : '#94a3b8',
                border: 'none', borderRadius: 10, cursor: inputUrl.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (inputUrl.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#0e7490'; }}
              onMouseLeave={e => { if (inputUrl.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#0891b2'; }}
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{
            background: 'none', border: 'none', color: '#0891b2',
            cursor: 'pointer', fontSize: 12, padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'}
        >
          Thay đổi URL ảnh
        </button>
      )}

      {helpText && <p className="adm-form-hint">{helpText}</p>}
    </div>
  );
}

// ——— Section: Store Info ———
function StoreInfoSection({
  settings, onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string | null) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Thông tin cửa hàng</h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Thông tin cơ bản về cửa hàng của bạn</p>
      </div>

      <div className="adm-form-grid">
        <div className="adm-form-stack">
          <InputField
            label="Tên cửa hàng"
            value={settings.storeName || ''}
            onChange={v => onChange('storeName', v || null)}
            placeholder="Hải Sản Biển Xanh"
            required
          />
          <TextareaField
            label="Mô tả cửa hàng"
            value={settings.storeDescription || ''}
            onChange={v => onChange('storeDescription', v || null)}
            placeholder="Mô tả ngắn về cửa hàng của bạn..."
            rows={3}
            helpText="Hiển thị trên trang giới thiệu và trong kết quả tìm kiếm"
          />
          <InputField
            label="Mã số thuế"
            value={settings.taxCode || ''}
            onChange={v => onChange('taxCode', v || null)}
            placeholder="0123456789"
            helpText="Mã số thuế của doanh nghiệp"
          />
          <TextareaField
            label="Giấy phép kinh doanh"
            value={settings.businessLicense || ''}
            onChange={v => onChange('businessLicense', v || null)}
            placeholder="Số giấy phép kinh doanh..."
            rows={2}
          />
          <TextareaField
            label="Giờ mở cửa"
            value={settings.openingHours || ''}
            onChange={v => onChange('openingHours', v || null)}
            placeholder={"Thứ 2 - Thứ 6: 7:00 - 20:00\nThứ 7 - CN: 8:00 - 18:00"}
            rows={3}
          />
        </div>

        <div className="adm-form-stack">
          <ImageUrlField
            label="Logo cửa hàng"
            value={settings.logo}
            onChange={v => onChange('logo', v)}
            helpText="Kích thước đề nghị: 200x200px"
          />
          <ImageUrlField
            label="Favicon"
            value={settings.favicon}
            onChange={v => onChange('favicon', v)}
            helpText="Kích thước đề nghị: 32x32px hoặc 64x64px"
          />
        </div>
      </div>
    </div>
  );
}

// ——— Section: Contact ———
function ContactSection({
  settings, onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string | null) => void;
}) {
  const emailError = settings.email ? (!isValidEmail(settings.email) ? 'Email không hợp lệ' : undefined) : undefined;
  const mapUrlError = settings.mapUrl && !isValidUrl(settings.mapUrl) ? 'URL không hợp lệ' : undefined;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Liên hệ & Địa chỉ</h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Thông tin liên hệ và địa chỉ giao hàng</p>
      </div>

      <div className="adm-form-grid">
        <div className="adm-form-stack">
          <InputField
            label="Số điện thoại"
            value={settings.phone || ''}
            onChange={v => onChange('phone', v || null)}
            placeholder="0901 234 567"
            icon={Phone}
            helpText="Số điện thoại liên hệ chính"
          />
          <InputField
            label="Hotline"
            value={settings.hotline || ''}
            onChange={v => onChange('hotline', v || null)}
            placeholder="1800 1234"
            icon={Phone}
            helpText="Đường dây nóng (nếu có)"
          />
          <InputField
            label="Email"
            value={settings.email || ''}
            onChange={v => onChange('email', v || null)}
            placeholder="contact@haisanbienxanh.vn"
            icon={Mail}
            type="email"
            error={emailError}
          />
          <TextareaField
            label="Địa chỉ"
            value={settings.address || ''}
            onChange={v => onChange('address', v || null)}
            placeholder="123 Đường Lê Văn Việt, Quận 9, TP. Thủ Đức"
            rows={2}
          />
        </div>

        <div className="adm-form-stack">
          <InputField
            label="Phường/Xã"
            value={settings.ward || ''}
            onChange={v => onChange('ward', v || null)}
            placeholder="Phường Long Bình"
          />
          <InputField
            label="Quận/Huyện"
            value={settings.district || ''}
            onChange={v => onChange('district', v || null)}
            placeholder="Quận 9"
          />
          <InputField
            label="Tỉnh/Thành phố"
            value={settings.city || ''}
            onChange={v => onChange('city', v || null)}
            placeholder="TP. Hồ Chí Minh"
          />
          <InputField
            label="Google Maps URL"
            value={settings.mapUrl || ''}
            onChange={v => onChange('mapUrl', v || null)}
            placeholder="https://maps.google.com/..."
            icon={Globe}
            helpText="Nhúng bản đồ Google Maps"
            error={mapUrlError}
          />
        </div>
      </div>

      {/* Policy */}
      <div className="adm-form-section">
        <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 12 }}>Chính sách</p>
        <div className="adm-form-grid">
          <TextareaField
            label="Chính sách giao hàng"
            value={settings.deliveryPolicy || ''}
            onChange={v => onChange('deliveryPolicy', v || null)}
            placeholder="Miễn phí giao hàng cho đơn hàng từ 500.000đ trở lên..."
            rows={3}
            helpText="Hiển thị ở footer website"
          />
          <TextareaField
            label="Chính sách đổi trả"
            value={settings.returnPolicy || ''}
            onChange={v => onChange('returnPolicy', v || null)}
            placeholder="Đổi trả trong vòng 24 giờ nếu sản phẩm không đúng mô tả..."
            rows={3}
            helpText="Hiển thị ở footer website"
          />
        </div>
      </div>

      {/* Shipping defaults */}
      <div className="adm-form-section">
        <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 12 }}>Giao hàng mặc định</p>
        <div className="adm-form-grid">
          <InputField
            label="Phí ship mặc định (VNĐ)"
            value={String(settings.defaultShippingFee ?? '0')}
            onChange={v => onChange('defaultShippingFee', v || null)}
            placeholder="30000"
            type="number"
          />
          <InputField
            label="Khu vực giao hàng mặc định"
            value={settings.defaultShippingZone || ''}
            onChange={v => onChange('defaultShippingZone', v || null)}
            placeholder="TP. Hồ Chí Minh"
            helpText="Khu vực mặc định khi tính phí ship"
          />
        </div>
      </div>
    </div>
  );
}

// ——— Section: Social ———
function SocialSection({
  settings, onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string | null) => void;
}) {
  const socialFields = [
    { field: 'facebookUrl' as const, label: 'Facebook', placeholder: 'https://facebook.com/haisanbienxanh', Icon: Facebook },
    { field: 'zaloUrl' as const, label: 'Zalo', placeholder: 'https://zalo.me/haisanbienxanh', Icon: MessageSquare },
    { field: 'tiktokUrl' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@haisanbienxanh', Icon: Globe },
    { field: 'youtubeUrl' as const, label: 'YouTube', placeholder: 'https://youtube.com/@haisanbienxanh', Icon: Globe },
    { field: 'instagramUrl' as const, label: 'Instagram', placeholder: 'https://instagram.com/haisanbienxanh', Icon: Globe },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Liên kết mạng xã hội</h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Các liên kết mạng xã hội hiển thị trên website</p>
      </div>

      <div className="adm-form-stack">
        {socialFields.map(({ field, label, placeholder, Icon }) => {
          const value = settings[field] || '';
          const urlError = value && !isValidUrl(value) ? 'URL không hợp lệ' : undefined;
          return (
            <InputField
              key={field}
              label={label}
              value={value}
              onChange={v => onChange(field, v || null)}
              placeholder={placeholder}
              icon={Icon}
              error={urlError}
              helpText="Để trống nếu chưa có"
            />
          );
        })}
      </div>
    </div>
  );
}

// ——— Section: SEO ———
function SeoSection({
  settings, onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string | null) => void;
}) {
  const titleError = settings.seoTitle && settings.seoTitle.length > 60 ? 'SEO Title không được vượt quá 60 ký tự' : undefined;
  const descError = settings.seoDescription && settings.seoDescription.length > 160 ? 'SEO Description không được vượt quá 160 ký tự' : undefined;
  const ogError = settings.ogImage && !isValidUrl(settings.ogImage) ? 'URL ảnh không hợp lệ' : undefined;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Cài đặt SEO</h3>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Tối ưu website cho công cụ tìm kiếm và mạng xã hội</p>
      </div>

      <div className="adm-form-stack">
        <InputField
          label="SEO Title"
          value={settings.seoTitle || ''}
          onChange={v => onChange('seoTitle', v || null)}
          placeholder="Hải Sản Biển Xanh - Hải sản tươi sống, đông lạnh chất lượng cao"
          helpText="Tiêu đề hiển thị trên Google (tối đa 60 ký tự)"
          error={titleError}
        />
        <TextareaField
          label="SEO Description"
          value={settings.seoDescription || ''}
          onChange={v => onChange('seoDescription', v || null)}
          placeholder="Chuyên cung cấp các loại hải sản tươi sống, hải sản đông lạnh và hải sản sơ chế chất lượng cao..."
          rows={3}
          helpText="Mô tả hiển thị trên Google (tối đa 160 ký tự)"
          error={descError}
          maxLength={160}
        />
        <TextareaField
          label="SEO Keywords"
          value={settings.seoKeywords || ''}
          onChange={v => onChange('seoKeywords', v || null)}
          placeholder="hải sản, hải sản tươi, cá, tôm, cua, ghẹ, mực, nghêu, sò"
          rows={2}
          helpText="Các từ khóa cách nhau bằng dấu phẩy"
        />
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
          <ImageUrlField
            label="OG Image (Open Graph)"
            value={settings.ogImage}
            onChange={v => onChange('ogImage', v)}
            helpText="Hình ảnh chia sẻ khi link được gửi lên mạng xã hội (1200x630px)"
          />
          {ogError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{ogError}</p>}
        </div>
      </div>
    </div>
  );
}

// ——— Loading Skeleton ———
function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 14, width: 120, background: '#e2e8f0', borderRadius: 6, animation: 'adm-pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 12, width: 80, background: '#e2e8f0', borderRadius: 4 }} />
              <div style={{ height: 40, background: '#e2e8f0', borderRadius: 10 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 12, width: 80, background: '#e2e8f0', borderRadius: 4 }} />
          <div style={{ height: 160, background: '#e2e8f0', borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

// ——— Error State ———
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={24} style={{ color: '#f87171' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>Không thể tải cài đặt</p>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Đã xảy ra lỗi khi kết nối với máy chủ</p>
      </div>
      <button
        onClick={onRetry}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          color: '#0891b2', background: 'transparent',
          border: '1px solid #a5f3fc', borderRadius: 10,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#ecfeff'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
      >
        <RefreshCw size={14} />
        Thử lại
      </button>
    </div>
  );
}

// ——— Tab Button ———
function TabButton({
  section, isActive, onClick,
}: {
  section: typeof SECTIONS[number];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', fontSize: 13, fontWeight: 500,
        border: 'none', borderLeft: '2px solid', cursor: 'pointer',
        transition: 'all 0.15s', textAlign: 'left',
        background: isActive ? '#ecfeff' : 'transparent',
        color: isActive ? '#0891b2' : '#475569',
        borderLeftColor: isActive ? '#0891b2' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLButtonElement).style.color = '#0f172a';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#475569';
        }
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {section.label}
    </button>
  );
}

// ——— Main Component ———
export default function SettingsPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [activeSection, setActiveSection] = useState<Section>('store');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(emptySettings());
  const [originalSettings, setOriginalSettings] = useState<StoreSettings | null>(null);

  const toastShownRef = useRef(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    toastShownRef.current = false;
    try {
      const res = await fetchSettings();
      const data = normalizeResponse(res);
      setSettings(data);
      setOriginalSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setFetchError(true);
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toastRef.current.error('Không thể tải cài đặt. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, []); // stable - no deps, runs once on mount

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!originalSettings) return;
    const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    const handleBeforeNav = () => {
      if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?')) {
        return false;
      }
      return true;
    };

    const linkHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor || anchor.getAttribute('href')?.startsWith('#')) return;
      if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?')) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeNav as any);
    document.addEventListener('click', linkHandler);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeNav as any);
      document.removeEventListener('click', linkHandler);
    };
  }, [settings, originalSettings]);

  const handleChange = useCallback((field: keyof StoreSettings, value: string | null) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasChanges = useMemo(() => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const hasValidationErrors = useMemo(() => {
    if (settings.seoTitle && settings.seoTitle.length > 60) return true;
    if (settings.seoDescription && settings.seoDescription.length > 160) return true;
    if (settings.email && !isValidEmail(settings.email)) return true;
    if (settings.ogImage && !isValidUrl(settings.ogImage)) return true;
    if (settings.mapUrl && !isValidUrl(settings.mapUrl)) return true;
    const urlFields = ['facebookUrl', 'zaloUrl', 'tiktokUrl', 'youtubeUrl', 'instagramUrl'] as const;
    return urlFields.some(f => settings[f] && !isValidUrl(settings[f]));
  }, [settings]);

  const canSave = hasChanges && !saving && !hasValidationErrors && !loading;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = { ...settings };
      if ('defaultShippingFee' in payload) {
        payload.defaultShippingFee = parseFloat(String(payload.defaultShippingFee)) || 0;
      }

      const res = await updateSettings(payload);
      const updated = normalizeResponse(res);

      setSettings(updated);
      setOriginalSettings(updated);
      toastRef.current.success('Đã lưu cài đặt thành công');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu cài đặt';
      toastRef.current.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    if (loading) return <LoadingSkeleton />;
    if (fetchError) return <ErrorState onRetry={loadSettings} />;

    switch (activeSection) {
      case 'store': return <StoreInfoSection settings={settings} onChange={handleChange} />;
      case 'contact': return <ContactSection settings={settings} onChange={handleChange} />;
      case 'social': return <SocialSection settings={settings} onChange={handleChange} />;
      case 'seo': return <SeoSection settings={settings} onChange={handleChange} />;
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header" style={{ flexWrap: 'wrap' }}>
        <div>
          <h2> Cài đặt cửa hàng</h2>
          <p>Quản lý thông tin cửa hàng và cấu hình website</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasChanges && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', fontSize: 11, fontWeight: 500,
              background: '#fffbeb', color: '#b45309',
              border: '1px solid #fde68a', borderRadius: 999,
            }}>
              <AlertCircle size={11} />
              Có thay đổi chưa lưu
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            title={
              hasValidationErrors
                ? 'Vui lòng sửa lỗi validation trước khi lưu'
                : !hasChanges
                ? 'Không có thay đổi để lưu'
                : ''
            }
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', fontSize: 13, fontWeight: 600,
              border: 'none', borderRadius: 10, cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, opacity 0.15s',
              background: canSave ? '#0891b2' : '#f1f5f9',
              color: canSave ? '#fff' : '#94a3b8',
            }}
            onMouseEnter={e => { if (canSave) (e.currentTarget as HTMLButtonElement).style.background = '#0e7490'; }}
            onMouseLeave={e => { if (canSave) (e.currentTarget as HTMLButtonElement).style.background = '#0891b2'; }}
          >
            <Save size={14} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Layout: Tabs + Content */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div style={{
          width: 220, flexShrink: 0,
          background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {SECTIONS.map(section => (
            <TabButton
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 12,
          border: '1px solid #e2e8f0', padding: 24,
          minHeight: 520, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
