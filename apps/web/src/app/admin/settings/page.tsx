'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save, Building2, Phone, Mail, Globe, MessageSquare,
  Truck, Link2, Facebook, ImagePlus,
} from 'lucide-react';
import { useToast } from '../layout';
import { fetchSettings, updateSettings } from '@/lib/admin/api';

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
  logo: string | null;
  favicon: string | null;
  hotline: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  deliveryPolicy: string | null;
  returnPolicy: string | null;
  defaultShippingFee: string;
  defaultShippingZone: string | null;
  facebookUrl: string | null;
  zaloUrl: string | null;
  tiktokUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
}

// Input component
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: Icon,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
  helpText?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={14} style={{ color: '#94a3b8' }} />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 14,
          color: '#0f172a',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.target.style.borderColor = '#0891b2')}
        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
      />
      {helpText && <small style={{ fontSize: 12, color: '#94a3b8' }}>{helpText}</small>}
    </div>
  );
}

// Textarea component
function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 14,
          color: '#0f172a',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.target.style.borderColor = '#0891b2')}
        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
      />
      {helpText && <small style={{ fontSize: 12, color: '#94a3b8' }}>{helpText}</small>}
    </div>
  );
}

// Upload component
function ImageUpload({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  helpText?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</label>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img
            src={value}
            alt={label}
            style={{ width: '100%', maxWidth: 200, height: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}
          />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{
          border: '2px dashed #e2e8f0',
          borderRadius: 12,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: '#f8fafc',
        }}
          onClick={() => {
            const url = prompt('Nhập URL hình ảnh:');
            if (url) onChange(url);
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#0891b2';
            (e.currentTarget as HTMLDivElement).style.background = '#ecfeff';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
            (e.currentTarget as HTMLDivElement).style.background = '#f8fafc';
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            color: '#94a3b8',
          }}>
            <ImagePlus size={20} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Nhấn để nhập URL ảnh
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            PNG, JPG, WEBP
          </div>
        </div>
      )}
      {helpText && <small style={{ fontSize: 12, color: '#94a3b8' }}>{helpText}</small>}
    </div>
  );
}

// Section: Store Info
function StoreInfoSection({
  settings,
  onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
        Thông tin cửa hàng
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputField
            label="Tên cửa hàng"
            value={settings.storeName || ''}
            onChange={v => onChange('storeName', v)}
            placeholder="Hải Sản Biển Xanh"
          />
          <TextareaField
            label="Địa chỉ"
            value={settings.address || ''}
            onChange={v => onChange('address', v)}
            placeholder="123 Đường Lê Văn Việt, Quận 9, TP. Thủ Đức, TP.HCM"
            rows={2}
          />
          <TextareaField
            label="Giờ mở cửa"
            value={settings.openingHours || ''}
            onChange={v => onChange('openingHours', v)}
            placeholder="Thứ 2 - Thứ 6: 7:00 - 20:00&#10;Thứ 7 - CN: 8:00 - 18:00"
            rows={2}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ImageUpload
            label="Logo cửa hàng"
            value={settings.logo}
            onChange={v => onChange('logo', v)}
            helpText="Kích thước đề nghị: 200x200px"
          />
          <ImageUpload
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

// Section: Contact
function ContactSection({
  settings,
  onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
        Thông tin liên hệ
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputField
            label="Hotline"
            value={settings.hotline || ''}
            onChange={v => onChange('hotline', v)}
            placeholder="0901 234 567"
            icon={Phone}
            helpText="Số điện thoại hiển thị trên website"
          />
          <InputField
            label="Email"
            value={settings.email || ''}
            onChange={v => onChange('email', v)}
            placeholder="contact@haisanbienxanh.vn"
            icon={Mail}
            type="email"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextareaField
            label="Chính sách giao hàng"
            value={settings.deliveryPolicy || ''}
            onChange={v => onChange('deliveryPolicy', v)}
            placeholder="Miễn phí giao hàng cho đơn hàng từ 500.000đ trở lên..."
            rows={3}
            helpText="Hiển thị ở footer website"
          />
          <TextareaField
            label="Chính sách đổi trả"
            value={settings.returnPolicy || ''}
            onChange={v => onChange('returnPolicy', v)}
            placeholder="Đổi trả trong vòng 24 giờ nếu sản phẩm không đúng mô tả..."
            rows={3}
            helpText="Hiển thị ở footer website"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <InputField
          label="Phí ship mặc định"
          value={settings.defaultShippingFee || '0'}
          onChange={v => onChange('defaultShippingFee', v)}
          placeholder="30000"
          type="number"
          icon={Truck}
          helpText="Đơn vị: VNĐ"
        />
        <InputField
          label="Khu vực giao hàng mặc định"
          value={settings.defaultShippingZone || ''}
          onChange={v => onChange('defaultShippingZone', v)}
          placeholder="TP. Hồ Chí Minh"
          helpText="Khu vực mặc định khi tính phí ship"
        />
      </div>
    </div>
  );
}

// Section: Social
function SocialSection({
  settings,
  onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
        Liên kết mạng xã hội
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputField
          label="Facebook"
          value={settings.facebookUrl || ''}
          onChange={v => onChange('facebookUrl', v)}
          placeholder="https://facebook.com/haisanbienxanh"
          icon={Facebook}
        />
        <InputField
          label="Zalo"
          value={settings.zaloUrl || ''}
          onChange={v => onChange('zaloUrl', v)}
          placeholder="https://zalo.me/haisanbienxanh"
          icon={MessageSquare}
        />
        <InputField
          label="TikTok"
          value={settings.tiktokUrl || ''}
          onChange={v => onChange('tiktokUrl', v)}
          placeholder="https://tiktok.com/@haisanbienxanh"
          icon={Globe}
        />
      </div>
    </div>
  );
}

// Section: SEO
function SeoSection({
  settings,
  onChange,
}: {
  settings: StoreSettings;
  onChange: (field: keyof StoreSettings, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
        Cài đặt SEO
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputField
          label="SEO Title"
          value={settings.seoTitle || ''}
          onChange={v => onChange('seoTitle', v)}
          placeholder="Hải Sản Biển Xanh - Hải sản tươi sống, đông lạnh chất lượng cao"
          helpText="Tiêu đề hiển thị trên Google (tối đa 60 ký tự)"
        />
        <TextareaField
          label="SEO Description"
          value={settings.seoDescription || ''}
          onChange={v => onChange('seoDescription', v)}
          placeholder="Chuyên cung cấp các loại hải sản tươi sống, hải sản đông lạnh và hải sản sơ chế chất lượng cao. Giao hàng nhanh chóng trên toàn quốc."
          rows={3}
          helpText="Mô tả hiển thị trên Google (tối đa 160 ký tự)"
        />
        <TextareaField
          label="SEO Keywords"
          value={settings.seoKeywords || ''}
          onChange={v => onChange('seoKeywords', v)}
          placeholder="hải sản, hải sản tươi, cá, tôm, cua, ghẹ, mực, nghêu, sò"
          rows={2}
          helpText="Các từ khóa cách nhau bằng dấu phẩy"
        />
        <ImageUpload
          label="OG Image (Open Graph)"
          value={settings.ogImage}
          onChange={v => onChange('ogImage', v)}
          helpText="Hình ảnh chia sẻ khi link được gửi lên mạng xã hội (1200x630px)"
        />
      </div>
    </div>
  );
}

// ——— Main Component ———
export default function SettingsPage() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<Section>('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    id: '',
    storeName: '',
    logo: null,
    favicon: null,
    hotline: null,
    email: null,
    address: null,
    openingHours: null,
    deliveryPolicy: null,
    returnPolicy: null,
    defaultShippingFee: '0',
    defaultShippingZone: null,
    facebookUrl: null,
    zaloUrl: null,
    tiktokUrl: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImage: null,
  });
  const [originalSettings, setOriginalSettings] = useState<StoreSettings | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSettings();
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...data,
          defaultShippingFee: data.defaultShippingFee?.toString() || '0',
        });
        setOriginalSettings({
          ...data,
          defaultShippingFee: data.defaultShippingFee?.toString() || '0',
        });
      }
    } catch {
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = useCallback((field: keyof StoreSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value || null }));
  }, []);

  const hasChanges = originalSettings
    ? JSON.stringify(settings) !== JSON.stringify(originalSettings)
    : false;

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...settings,
        defaultShippingFee: parseFloat(settings.defaultShippingFee) || 0,
      };
      const res = await updateSettings(dataToSave);
      if (res.ok) {
        const updated = await res.json();
        setSettings({
          ...updated,
          defaultShippingFee: updated.defaultShippingFee?.toString() || '0',
        });
        setOriginalSettings({
          ...updated,
          defaultShippingFee: updated.defaultShippingFee?.toString() || '0',
        });
        toast.success('Đã lưu cài đặt');
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ color: '#94a3b8' }}>Đang tải...</div>
        </div>
      );
    }

    switch (activeSection) {
      case 'store':
        return <StoreInfoSection settings={settings} onChange={handleChange} />;
      case 'contact':
        return <ContactSection settings={settings} onChange={handleChange} />;
      case 'social':
        return <SocialSection settings={settings} onChange={handleChange} />;
      case 'seo':
        return <SeoSection settings={settings} onChange={handleChange} />;
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Cài đặt cửa hàng</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Quản lý thông tin cửa hàng và cấu hình website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: hasChanges ? '#0891b2' : '#e2e8f0',
            color: hasChanges ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseOver={e => {
            if (hasChanges) (e.currentTarget as HTMLButtonElement).style.background = '#0e7490';
          }}
          onMouseOut={e => {
            if (hasChanges) (e.currentTarget as HTMLButtonElement).style.background = '#0891b2';
          }}
        >
          <Save size={16} />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Layout: Sidebar + Content */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{
          width: 220,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          {SECTIONS.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  background: isActive ? '#ecfeff' : 'transparent',
                  color: isActive ? '#0891b2' : '#64748b',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 24,
          minHeight: 500,
        }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
