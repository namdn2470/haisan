'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Save, RefreshCw, Globe, Home, Menu, Phone,
  CheckCircle, LayoutTemplate
} from 'lucide-react';
import { useToast } from '../layout-client';
import {
  getAllConfigs,
  batchUpdateConfigs,
  initializeConfigs,
} from '@/lib/admin/api';

// ——— Types ———
interface SiteConfig {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  label: string | null;
  description: string | null;
  isPublic: boolean;
}

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const SECTIONS: ConfigSection[] = [
  { id: 'topbar', title: 'Topbar & Liên hệ', description: 'Cấu hình hotline, mạng xã hội, thông tin hiển thị trên topbar', icon: Phone, color: '#0891b2' },
  { id: 'homepage', title: 'Trang chủ', description: 'Hiển thị/ẩn các section trên trang chủ', icon: Home, color: '#059669' },
  { id: 'policy', title: 'Chính sách', description: 'Cấu hình các chính sách: giao hàng, đổi trả, hoàn tiền', icon: CheckCircle, color: '#d97706' },
  { id: 'menu', title: 'Menu', description: 'Cấu hình các mục menu chính', icon: Menu, color: '#7c3aed' },
  { id: 'footer', title: 'Footer', description: 'Cấu hình thông tin footer', icon: LayoutTemplate, color: '#3b82f6' },
  { id: 'seo', title: 'SEO', description: 'Cấu hình tiêu đề, mô tả, từ khóa SEO', icon: Globe, color: '#ef4444' },
];

// ——— Input Components ———
function StringInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.15s',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
      onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
    />
  );
}

function NumberInput({ value, onChange, placeholder, prefix, suffix }: { value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (v: string) => {
    const num = v.replace(/[^\d]/g, '');
    setDisplayValue(num);
    onChange(num);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && (
        <span style={{ position: 'absolute', left: 12, color: '#64748b', fontSize: 14 }}>{prefix}</span>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          paddingLeft: prefix ? 32 : 12,
          paddingRight: suffix ? 48 : 12,
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: 12, color: '#64748b', fontSize: 14 }}>{suffix}</span>
      )}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        fontSize: 14,
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
      onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
    />
  );
}

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: value ? '#0891b2' : '#e2e8f0',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: value ? 22 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
      </div>
      {label && <span style={{ color: '#334155', fontSize: 14 }}>{label}</span>}
    </label>
  );
}

function ConfigItem({ config, onChange }: { config: SiteConfig; onChange: (key: string, value: string) => void }) {
  const renderInput = () => {
    switch (config.type) {
      case 'boolean':
        return <ToggleSwitch value={config.value === 'true'} onChange={(v) => onChange(config.key, String(v))} />;
      case 'number':
        return (
          <NumberInput
            value={config.value}
            onChange={(v) => onChange(config.key, v)}
            placeholder={config.label || config.key}
          />
        );
      case 'json':
        try {
          const parsed = JSON.parse(config.value);
          return (
            <details style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 13, color: '#64748b' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, color: '#334155' }}>Xem nội dung JSON</summary>
              <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(parsed, null, 2)}</pre>
            </details>
          );
        } catch {
          return <TextArea value={config.value} onChange={(v) => onChange(config.key, v)} placeholder="JSON" rows={4} />;
        }
      default:
        if (config.value.length > 100) {
          return <TextArea value={config.value} onChange={(v) => onChange(config.key, v)} placeholder={config.label || config.key} rows={3} />;
        }
        return <StringInput value={config.value} onChange={(v) => onChange(config.key, v)} placeholder={config.label || config.key} />;
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
        {config.label || config.key}
      </label>
      {config.description && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>{config.description}</p>
      )}
      {renderInput()}
    </div>
  );
}

// ——— Section Components ———
function TopbarSection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <ConfigItem config={configs.find(c => c.key === 'hotline') || { id: '', key: 'hotline', value: '', type: 'string', group: 'topbar', label: 'Hotline', description: 'Số điện thoại hotline', isPublic: true }} onChange={onChange} />
        <ConfigItem config={configs.find(c => c.key === 'free_shipping_threshold') || { id: '', key: 'free_shipping_threshold', value: '500000', type: 'number', group: 'topbar', label: 'Miễn phí giao hàng từ', description: 'Đơn hàng từ bao nhiêu sẽ được miễn phí giao', isPublic: true }} onChange={onChange} />
        <ConfigItem config={configs.find(c => c.key === 'zalo_url') || { id: '', key: 'zalo_url', value: '', type: 'string', group: 'topbar', label: 'Link Zalo', description: 'Link Zalo OA', isPublic: true }} onChange={onChange} />
        <ConfigItem config={configs.find(c => c.key === 'facebook_url') || { id: '', key: 'facebook_url', value: '', type: 'string', group: 'topbar', label: 'Link Facebook', description: 'Link Facebook page', isPublic: true }} onChange={onChange} />
      </div>
    </div>
  );
}

function HomepageSection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  const toggles = [
    { key: 'home_categories_visible', label: 'Hiển thị danh mục' },
    { key: 'home_featured_visible', label: 'Hiển thị sản phẩm nổi bật' },
    { key: 'home_bestseller_visible', label: 'Hiển thị sản phẩm bán chạy' },
    { key: 'home_newarrival_visible', label: 'Hiển thị sản phẩm mới' },
    { key: 'home_promo_visible', label: 'Hiển thị khuyến mãi' },
    { key: 'home_testimonial_visible', label: 'Hiển thị đánh giá khách hàng' },
  ];

  return (
    <div>
      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
          Bật/tắt hiển thị các section trên trang chủ. Nội dung các section được cấu hình riêng trong phần quản lý tương ứng.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {toggles.map((t) => {
            const cfg = configs.find(c => c.key === t.key);
            return (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 500, color: '#334155' }}>{t.label}</span>
                <ToggleSwitch
                  value={cfg?.value === 'true'}
                  onChange={(v) => onChange(t.key, String(v))}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PolicySection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  const policies = [
    { key: 'policy_free_shipping', label: 'Chính sách giao hàng', placeholder: 'Miễn phí giao hàng cho đơn từ 500.000đ' },
    { key: 'policy_return', label: 'Chính sách đổi trả', placeholder: 'Đổi trả trong 24h nếu sản phẩm không đúng chất lượng' },
    { key: 'policy_refund', label: 'Chính sách hoàn tiền', placeholder: 'Hoàn tiền 100% nếu sản phẩm không đạt yêu cầu' },
    { key: 'policy_quality', label: 'Cam kết chất lượng', placeholder: 'Cam kết 100% hải sản tươi sống, đảm bảo chất lượng' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {policies.map((p) => (
          <ConfigItem
            key={p.key}
            config={configs.find(c => c.key === p.key) || { id: '', key: p.key, value: '', type: 'string', group: 'policy', label: p.label, description: '', isPublic: true }}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function MenuSection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  const menuConfig = configs.find(c => c.key === 'menu_items');
  let menuItems: { label: string; url: string; icon: string }[] = [];

  try {
    if (menuConfig?.value) {
      menuItems = JSON.parse(menuConfig.value);
    }
  } catch {
    menuItems = [];
  }

  const updateMenuItem = (index: number, field: string, value: string) => {
    const newItems = [...menuItems];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange('menu_items', JSON.stringify(newItems));
  };

  const addMenuItem = () => {
    menuItems.push({ label: '', url: '/', icon: 'link' });
    onChange('menu_items', JSON.stringify(menuItems));
  };

  const removeMenuItem = (index: number) => {
    const newItems = menuItems.filter((_, i) => i !== index);
    onChange('menu_items', JSON.stringify(newItems));
  };

  return (
    <div>
      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Cấu hình các mục menu chính hiển thị trên website.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {menuItems.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'center', padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Tên menu</label>
              <StringInput value={item.label} onChange={(v) => updateMenuItem(index, 'label', v)} placeholder="Tên menu" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Đường dẫn</label>
              <StringInput value={item.url} onChange={(v) => updateMenuItem(index, 'url', v)} placeholder="/products" />
            </div>
            <button
              onClick={() => removeMenuItem(index)}
              style={{
                padding: '8px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 13,
                marginTop: 20,
              }}
            >
              Xóa
            </button>
          </div>
        ))}

        <button
          onClick={addMenuItem}
          style={{
            padding: '12px 20px',
            background: '#ecfeff',
            border: '1px dashed #0891b2',
            borderRadius: 8,
            color: '#0891b2',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          + Thêm mục menu
        </button>
      </div>
    </div>
  );
}

function FooterSection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
      <ConfigItem config={configs.find(c => c.key === 'footer_about') || { id: '', key: 'footer_about', value: '', type: 'string', group: 'footer', label: 'Giới thiệu', description: '', isPublic: true }} onChange={onChange} />
      <ConfigItem config={configs.find(c => c.key === 'footer_address') || { id: '', key: 'footer_address', value: '', type: 'string', group: 'footer', label: 'Địa chỉ', description: '', isPublic: true }} onChange={onChange} />
      <ConfigItem config={configs.find(c => c.key === 'footer_email') || { id: '', key: 'footer_email', value: '', type: 'string', group: 'footer', label: 'Email', description: '', isPublic: true }} onChange={onChange} />
      <ConfigItem config={configs.find(c => c.key === 'footer_working_hours') || { id: '', key: 'footer_working_hours', value: '', type: 'string', group: 'footer', label: 'Giờ làm việc', description: '', isPublic: true }} onChange={onChange} />
    </div>
  );
}

function SeoSection({ configs, onChange }: { configs: SiteConfig[]; onChange: (key: string, value: string) => void }) {
  return (
    <div>
      <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16, border: '1px solid #fecaca', marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#991b1b' }}>
          <strong>Cảnh báo:</strong> Thay đổi SEO có thể ảnh hưởng đến xếp hạng tìm kiếm. Hãy cập nhật từ từ và theo dõi kết quả.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <ConfigItem config={configs.find(c => c.key === 'seo_title') || { id: '', key: 'seo_title', value: '', type: 'string', group: 'seo', label: 'Tiêu đề SEO', description: 'Tối ưu 60-70 ký tự', isPublic: true }} onChange={onChange} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <ConfigItem config={configs.find(c => c.key === 'seo_description') || { id: '', key: 'seo_description', value: '', type: 'string', group: 'seo', label: 'Mô tả SEO', description: 'Tối ưu 150-160 ký tự', isPublic: true }} onChange={onChange} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <ConfigItem config={configs.find(c => c.key === 'seo_keywords') || { id: '', key: 'seo_keywords', value: '', type: 'string', group: 'seo', label: 'Từ khóa SEO', description: 'Các từ khóa chính, cách nhau bằng dấu phẩy', isPublic: true }} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

// ——— Main Component ———
export default function AdminConfigPage() {
  const [activeSection, setActiveSection] = useState<string>('topbar');
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  // Track changes
  const [originalConfigs, setOriginalConfigs] = useState<SiteConfig[]>([]);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllConfigs();
      const list: SiteConfig[] = Array.isArray(data) ? data : [];
      setConfigs(list);
      setOriginalConfigs(list);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => {
      const exists = prev.some(c => c.key === key);
      if (exists) return prev.map(c => c.key === key ? { ...c, value } : c);
      const type = value === 'true' || value === 'false' ? 'boolean'
        : (value !== '' && !isNaN(Number(value)) ? 'number' : 'string');
      return [...prev, { id: '', key, value, type, group: activeSection, label: key, description: null, isPublic: true }];
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Include both changed configs AND new configs not yet in DB
      const changedConfigs = configs.filter(cfg => {
        const original = originalConfigs.find(o => o.key === cfg.key);
        return !original || original.value !== cfg.value;
      });

      if (changedConfigs.length === 0) {
        toast.info('Không có thay đổi để lưu');
        return;
      }

      await batchUpdateConfigs(changedConfigs.map(c => ({
        key: c.key,
        value: c.value,
        type: c.type,
        group: c.group,
        label: c.label ?? undefined,
        description: c.description ?? undefined,
      })));

      setOriginalConfigs(configs);
      setHasChanges(false);
      toast.success(`Đã lưu ${changedConfigs.length} cấu hình`);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeConfigs();
      toast.success('Đã khởi tạo cấu hình mặc định');
      setHasChanges(false);
      await fetchConfigs();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể khởi tạo cấu hình');
    }
  };

  const renderSection = () => {
    const sectionConfigs = configs.filter(c => c.group === activeSection);

    switch (activeSection) {
      case 'topbar':
        return <TopbarSection configs={sectionConfigs} onChange={handleChange} />;
      case 'homepage':
        return <HomepageSection configs={sectionConfigs} onChange={handleChange} />;
      case 'policy':
        return <PolicySection configs={sectionConfigs} onChange={handleChange} />;
      case 'menu':
        return <MenuSection configs={sectionConfigs} onChange={handleChange} />;
      case 'footer':
        return <FooterSection configs={sectionConfigs} onChange={handleChange} />;
      case 'seo':
        return <SeoSection configs={sectionConfigs} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#ecfeff',
            color: '#0891b2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Settings size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Cấu hình Website</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Thiết lập các thông số cấu hình cho website</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleInitialize}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
              color: '#334155',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Khởi tạo mặc định
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px',
              border: 'none',
              borderRadius: 8,
              background: hasChanges ? '#0891b2' : '#94a3b8',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={14} />
            {saving ? 'Đang lưu...' : hasChanges ? 'Lưu thay đổi' : 'Đã lưu'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar Navigation */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16, position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
            Cấu hình
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 8,
                    background: isActive ? '#ecfeff' : 'transparent',
                    color: isActive ? '#0891b2' : '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 8,
                    background: isActive ? section.color : '#f1f5f9',
                    color: isActive ? '#fff' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{section.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {SECTIONS.find(s => s.id === activeSection)?.title}
                  {hasChanges && (
                    <span style={{ fontSize: 12, fontWeight: 500, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 999 }}>
                      Có thay đổi chưa lưu
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  {SECTIONS.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              {renderSection()}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
