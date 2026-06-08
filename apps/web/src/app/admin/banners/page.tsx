'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, Image, AlertTriangle,
  Calendar, Eye, EyeOff, X, ArrowUp, ArrowDown, ImageIcon,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import {
  fetchBanners,
  fetchBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} from '@/lib/admin/api';

const BANNER_POSITIONS: Record<string, { label: string; color: string; bg: string }> = {
  HOME_HERO: { label: 'Hero Trang chủ', color: '#0891b2', bg: '#e0f2fe' },
  HOME_PROMO: { label: 'Khuyến mãi', color: '#7c3aed', bg: '#ede9fe' },
  MOBILE_HERO: { label: 'Di động', color: '#059669', bg: '#d1fae5' },
  SIDEBAR_PROMO: { label: 'Sidebar', color: '#d97706', bg: '#fef3c7' },
};

const POSITION_OPTIONS = [
  { value: 'HOME_HERO', label: 'Hero Trang chủ' },
  { value: 'HOME_PROMO', label: 'Khuyến mãi Trang chủ' },
  { value: 'MOBILE_HERO', label: 'Banner Di động' },
  { value: 'SIDEBAR_PROMO', label: 'Banner Sidebar' },
];

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  position: 'HOME_HERO',
  sortOrder: 0,
  isActive: true,
  startAt: '',
  endAt: '',
};

export default function BannersPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { position?: string; isActive?: boolean; search?: string } = {};
      if (positionFilter) params.position = positionFilter;
      if (activeFilter === 'true') params.isActive = true;
      if (activeFilter === 'false') params.isActive = false;
      if (search) params.search = search;

      const result = await fetchBanners(params) as { data: Banner[] };
      setBanners(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách banner');
      showError(err.message || 'Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  }, [positionFilter, activeFilter, search, showError]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      loadBanners();
    }, 400);
    setSearchTimeout(timeout);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setModalMode('create');
    setEditingBanner(null);
    setShowModal(true);
  };

  const openEdit = async (banner: Banner) => {
    try {
      const res = await fetchBannerById(banner.id) as { data: Banner };
      const data = res.data;
      setEditingBanner(data);
      setForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        imageUrl: data.imageUrl || '',
        linkUrl: data.linkUrl || '',
        position: data.position || 'HOME_HERO',
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
        startAt: data.startAt ? data.startAt.split('T')[0] : '',
        endAt: data.endAt ? data.endAt.split('T')[0] : '',
      });
      setFormErrors({});
      setModalMode('edit');
      setShowModal(true);
    } catch {
      showError('Không thể tải thông tin banner');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleFormChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Tiêu đề là bắt buộc';
    if (!form.imageUrl.trim()) errors.imageUrl = 'Ảnh banner là bắt buộc';
    if (!form.position) errors.position = 'Vị trí là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || null,
        position: form.position,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      };

      if (modalMode === 'create') {
        await createBanner(payload);
        success('Đã tạo banner mới');
      } else {
        await updateBanner(editingBanner!.id, payload);
        success('Đã cập nhật banner');
      }

      closeModal();
      loadBanners();
    } catch (err: any) {
      showError(err.message || 'Không thể lưu banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (banner: Banner) => {
    const newActive = !banner.isActive;
    confirm({
      title: newActive ? 'Hiển thị banner' : 'Ẩn banner',
      message: newActive
        ? `Hiển thị banner "${banner.title}" trên website?`
        : `Ẩn banner "${banner.title}"? Banner sẽ không hiển thị.`,
      confirmText: newActive ? 'Hiển thị' : 'Ẩn',
      type: 'warning',
      onConfirm: async () => {
        try {
          await updateBanner(banner.id, { isActive: newActive });
          success(newActive ? 'Đã hiển thị banner' : 'Đã ẩn banner');
          loadBanners();
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái banner');
        }
      },
    });
  };

  const handleDelete = (banner: Banner) => {
    confirm({
      title: 'Xóa banner',
      message: `Xóa vĩnh viễn banner "${banner.title}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteBanner(banner.id);
          success('Đã xóa banner');
          loadBanners();
        } catch (err: any) {
          showError(err.message || 'Không thể xóa banner');
        }
      },
    });
  };

  const handleSort = async (banner: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === banner.id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const other = banners[swapIdx];
    try {
      await updateBanner(banner.id, { sortOrder: other.sortOrder });
      await updateBanner(other.id, { sortOrder: banner.sortOrder });
      loadBanners();
    } catch (err: any) {
      showError(err.message || 'Không thể sắp xếp banner');
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý Banner / Slider</h2>
          <p>{banners.length} banner</p>
        </div>
        <button className="adm-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Thêm Banner
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm banner..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="adm-search-input"
          />
        </div>
        <button
          className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={15} />
          Bộ lọc
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="adm-filter-row">
          <select
            value={positionFilter}
            onChange={e => { setPositionFilter(e.target.value); loadBanners(); }}
            className="adm-select"
          >
            <option value="">Tất cả vị trí</option>
            {POSITION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={e => { setActiveFilter(e.target.value); loadBanners(); }}
            className="adm-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đang ẩn</option>
          </select>
          {(positionFilter || activeFilter) && (
            <button
              className="adm-btn-ghost"
              onClick={() => { setPositionFilter(''); setActiveFilter(''); loadBanners(); }}
            >
              Xóa lọc
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="adm-loading-spinner" style={{ padding: 60 }} />
        ) : error ? (
          <div className="adm-error">
            <div className="adm-error-icon"><AlertTriangle size={24} /></div>
            <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
            <p className="adm-error-desc">{error}</p>
            <button className="adm-error-retry" onClick={loadBanners}>Thử lại</button>
          </div>
        ) : banners.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Image size={32} /></div>
            <p className="adm-empty-title">Không có banner nào</p>
            <p className="adm-empty-desc">
              {search || positionFilter || activeFilter
                ? 'Không tìm thấy banner phù hợp'
                : 'Bắt đầu bằng cách thêm banner đầu tiên'}
            </p>
            {!search && !positionFilter && !activeFilter && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={openCreate}>
                <Plus size={16} /> Thêm Banner
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Thứ tự</th>
                    <th style={{ width: 80 }}>Hình ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Vị trí</th>
                    <th>Link</th>
                    <th style={{ width: 120 }}>Ngày hiệu lực</th>
                    <th style={{ width: 90 }}>Trạng thái</th>
                    <th style={{ width: 100, textAlign: 'center' as const }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner, idx) => {
                    const pos = BANNER_POSITIONS[banner.position] || {
                      label: banner.position,
                      color: '#64748b',
                      bg: '#f1f5f9',
                    };

                    return (
                      <tr key={banner.id}>
                        <td>
                          <div className="adm-order-controls">
                            <button
                              className="adm-action-btn"
                              title="Lên trên"
                              disabled={idx === 0}
                              onClick={() => handleSort(banner, 'up')}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <span style={{ fontWeight: 600, color: '#0f172a', minWidth: 20, textAlign: 'center' as const }}>
                              {banner.sortOrder}
                            </span>
                            <button
                              className="adm-action-btn"
                              title="Xuống dưới"
                              disabled={idx === banners.length - 1}
                              onClick={() => handleSort(banner, 'down')}
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="adm-banner-thumb" style={{ width: 60, height: 40 }}>
                            {banner.imageUrl ? (
                              <img src={banner.imageUrl} alt={banner.title} />
                            ) : (
                              <div className="adm-banner-placeholder">
                                <Image size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{banner.title}</div>
                            {banner.subtitle && (
                              <div style={{ fontSize: 12, color: '#64748b' }}>{banner.subtitle}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{ color: pos.color, background: pos.bg }}
                          >
                            {pos.label}
                          </span>
                        </td>
                        <td>
                          {banner.linkUrl ? (
                            <a
                              href={banner.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="adm-link-cell"
                              title={banner.linkUrl}
                            >
                              {banner.linkUrl.length > 30
                                ? banner.linkUrl.substring(0, 30) + '...'
                                : banner.linkUrl}
                            </a>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>-</span>
                          )}
                        </td>
                        <td>
                          <div className="adm-date-range">
                            <Calendar size={12} />
                            <span>
                              {banner.startAt || banner.endAt
                                ? `${banner.startAt ? banner.startAt.split('T')[0] : '...'} - ${banner.endAt ? banner.endAt.split('T')[0] : '...'}`
                                : '-'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{
                              color: banner.isActive ? '#10b981' : '#6b7280',
                              background: banner.isActive ? '#d1fae5' : '#f3f4f6',
                            }}
                          >
                            {banner.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Sửa"
                              onClick={() => openEdit(banner)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="adm-action-trigger"
                              title={banner.isActive ? 'Ẩn' : 'Hiển thị'}
                              onClick={() => handleToggleActive(banner)}
                            >
                              {banner.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                            <button
                              className="adm-action-trigger"
                              title="Xóa"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDelete(banner)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-header">
              <h3>{modalMode === 'create' ? 'Thêm banner mới' : 'Chỉnh sửa banner'}</h3>
              <button className="adm-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="adm-modal-body" style={{ padding: 20, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' as const }}>

                {/* Image Preview */}
                <div className="adm-form-section">
                  <div className="adm-form-section-title">Hình ảnh</div>
                  <div className="adm-form-row">
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Ảnh Banner <span style={{ color: '#ef4444' }}>*</span></label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 120,
                          height: 80,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          flexShrink: 0,
                        }}>
                          {form.imageUrl ? (
                            <img
                              src={form.imageUrl}
                              alt="Banner preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#cbd5e1',
                            }}>
                              <ImageIcon size={28} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            className={`adm-input ${formErrors.imageUrl ? 'error' : ''}`}
                            value={form.imageUrl}
                            onChange={e => handleFormChange('imageUrl', e.target.value)}
                            placeholder="Dán URL ảnh banner..."
                          />
                          {formErrors.imageUrl && <span className="adm-form-error">{formErrors.imageUrl}</span>}
                          <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                            Dán URL ảnh từ Cloudinary, Imgur hoặc dịch vụ khác
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="adm-form-section">
                  <div className="adm-form-section-title">Thông tin cơ bản</div>
                  <div className="adm-form-row">
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Tiêu đề <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className={`adm-input ${formErrors.title ? 'error' : ''}`}
                        value={form.title}
                        onChange={e => handleFormChange('title', e.target.value)}
                        placeholder="Nhập tiêu đề banner..."
                      />
                      {formErrors.title && <span className="adm-form-error">{formErrors.title}</span>}
                    </div>
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Mô tả</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={form.subtitle}
                        onChange={e => handleFormChange('subtitle', e.target.value)}
                        placeholder="Mô tả ngắn cho banner..."
                      />
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Link điều hướng</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={form.linkUrl}
                        onChange={e => handleFormChange('linkUrl', e.target.value)}
                        placeholder="https://example.com/promo..."
                      />
                    </div>
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Vị trí <span style={{ color: '#ef4444' }}>*</span></label>
                      <select
                        className={`adm-select ${formErrors.position ? 'error' : ''}`}
                        value={form.position}
                        onChange={e => handleFormChange('position', e.target.value)}
                      >
                        {POSITION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {formErrors.position && <span className="adm-form-error">{formErrors.position}</span>}
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={form.sortOrder}
                        onChange={e => handleFormChange('sortOrder', parseInt(e.target.value) || 0)}
                        min={0}
                      />
                      <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                        Số nhỏ hơn hiển thị trước
                      </span>
                    </div>
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Trạng thái</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', height: '100%', paddingTop: 8 }}>
                        <label className="adm-toggle-label">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => handleFormChange('isActive', e.target.checked)}
                            className="adm-checkbox"
                          />
                          <span style={{ fontSize: 14, color: form.isActive ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                            {form.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="adm-form-section">
                  <div className="adm-form-section-title">Thời gian hiệu lực</div>
                  <div className="adm-form-row">
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Ngày bắt đầu</label>
                      <input
                        type="date"
                        className="adm-input"
                        value={form.startAt}
                        onChange={e => handleFormChange('startAt', e.target.value)}
                      />
                    </div>
                    <div className="adm-form-group" style={{ flex: 1 }}>
                      <label className="adm-label">Ngày kết thúc</label>
                      <input
                        type="date"
                        className="adm-input"
                        value={form.endAt}
                        onChange={e => handleFormChange('endAt', e.target.value)}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Để trống nếu banner luôn hiển thị
                  </span>
                </div>

              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="adm-btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : modalMode === 'create' ? 'Thêm banner' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
