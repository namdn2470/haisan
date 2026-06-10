'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, Percent,
  Calendar, AlertTriangle, Tag, Ticket, X,
  Zap,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '@/lib/admin/api';

interface Promotion {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}

type ModalMode = 'create' | 'edit';
type DiscountType = 'PERCENT' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

interface FormData {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startAt: string;
  endAt: string;
  usageLimit: string;
  isActive: boolean;
}

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: 'PERCENT', label: 'Phần trăm (%)' },
  { value: 'FIXED_AMOUNT', label: 'Giảm tiền cố định (VNĐ)' },
  { value: 'FREE_SHIPPING', label: 'Miễn phí vận chuyển' },
];

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '') + 'đ';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatus(p: Promotion): 'ACTIVE' | 'INACTIVE' | 'EXPIRED' {
  if (!p.isActive) return 'INACTIVE';
  const now = new Date();
  if (new Date(p.endAt) < now) return 'EXPIRED';
  return 'ACTIVE';
}

function getDiscountDisplay(p: Promotion): { text: string; sub?: string } {
  if (p.discountType === 'PERCENT' || p.discountType === 'PERCENTAGE') {
    const sub = (p.maxDiscountAmount || 0) > 0
      ? `Tối đa ${formatCurrency(Number(p.maxDiscountAmount))}`
      : undefined;
    return { text: `${p.discountValue}%`, sub };
  }
  return { text: formatCurrency(Number(p.discountValue)), sub: undefined };
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Hoạt động', color: '#10b981', bg: '#d1fae5' },
  INACTIVE: { label: 'Tạm dừng', color: '#6b7280', bg: '#f3f4f6' },
  EXPIRED: { label: 'Hết hạn', color: '#ef4444', bg: '#fee2e2' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Tạm dừng' },
  { value: 'EXPIRED', label: 'Hết hạn' },
];

function emptyForm(): FormData {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 16);
  return {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startAt: fmt(now),
    endAt: fmt(nextWeek),
    usageLimit: '',
    isActive: true,
  };
}

function promotionToForm(p: Promotion): FormData {
  const discountType = (p.discountType === 'PERCENTAGE' ? 'PERCENT' : p.discountType) as DiscountType;
  return {
    code: p.code,
    name: p.name || '',
    description: p.description || '',
    discountType,
    discountValue: String(p.discountValue),
    minOrderAmount: p.minOrderAmount ? String(p.minOrderAmount) : '',
    maxDiscountAmount: p.maxDiscountAmount ? String(p.maxDiscountAmount) : '',
    startAt: p.startAt ? new Date(p.startAt).toISOString().slice(0, 16) : '',
    endAt: p.endAt ? new Date(p.endAt).toISOString().slice(0, 16) : '',
    usageLimit: p.usageLimit ? String(p.usageLimit) : '',
    isActive: p.isActive,
  };
}

export default function PromotionsPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const limit = 15;

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPromotions({
        search: search || undefined,
        page,
        limit,
      });
      setPromotions(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách khuyến mãi';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, showError]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Filter by status on frontend (simple approach since backend doesn't have this yet)
  const filtered = statusFilter
    ? promotions.filter(p => {
        const s = getStatus(p);
        return statusFilter === 'ACTIVE' ? s === 'ACTIVE'
          : statusFilter === 'INACTIVE' ? s === 'INACTIVE'
          : s === 'EXPIRED';
      })
    : promotions;

  const openCreate = () => {
    setModalMode('create');
    setEditId(null);
    setForm(emptyForm());
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Promotion) => {
    setModalMode('edit');
    setEditId(p.id);
    setForm(promotionToForm(p));
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm());
    setFormErrors({});
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.code.trim()) errors.code = 'Mã giảm giá là bắt buộc';
    if (!form.name.trim()) errors.name = 'Tên chương trình là bắt buộc';
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0) {
      errors.discountValue = 'Giá trị giảm phải lớn hơn 0';
    }
    if (form.discountType === 'PERCENT' && Number(form.discountValue) > 100) {
      errors.discountValue = 'Phần trăm giảm không được vượt quá 100%';
    }
    if (!form.startAt) errors.startAt = 'Ngày bắt đầu là bắt buộc';
    if (!form.endAt) errors.endAt = 'Ngày kết thúc là bắt buộc';
    if (form.startAt && form.endAt && new Date(form.startAt) >= new Date(form.endAt)) {
      errors.endAt = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        isActive: form.isActive,
      };

      if (modalMode === 'create') {
        const result = await createPromotion(payload);
        success('Đã thêm khuyến mãi thành công');
        // adminFetch unwraps { data: promo } → result is the promo directly
        const created = result.data ?? result;
        if (created && created.id) {
          setPromotions(prev => [created, ...prev]);
          setTotal(prev => prev + 1);
        }
      } else {
        const result = await updatePromotion(editId!, payload);
        success('Đã cập nhật khuyến mãi thành công');
        const updated = result.data ?? result;
        if (updated && updated.id) {
          setPromotions(prev => prev.map(p => p.id === editId ? updated : p));
        }
      }
      closeModal();
    } catch (err: any) {
      showError(err?.message || 'Không thể lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (promotion: Promotion) => {
    const newActive = !promotion.isActive;
    confirm({
      title: newActive ? 'Kích hoạt khuyến mãi' : 'Tạm dừng khuyến mãi',
      message: newActive
        ? `Kích hoạt mã "${promotion.code}"?`
        : `Tạm dừng mã "${promotion.code}"? Khách hàng sẽ không thể sử dụng mã này.`,
      confirmText: newActive ? 'Kích hoạt' : 'Tạm dừng',
      cancelText: 'Hủy',
      type: 'warning',
      onConfirm: async () => {
        try {
          await updatePromotion(promotion.id, { isActive: newActive });
          success(newActive ? 'Đã kích hoạt khuyến mãi' : 'Đã tạm dừng khuyến mãi');
          setPromotions(prev =>
            prev.map(p => p.id === promotion.id ? { ...p, isActive: newActive } : p)
          );
        } catch (err: any) {
          showError(err?.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const handleDelete = (promotion: Promotion) => {
    confirm({
      title: 'Xóa khuyến mãi',
      message: `Xóa vĩnh viễn mã "${promotion.code}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          const result = await deletePromotion(promotion.id);
          success(result.message || 'Đã xóa khuyến mãi');
          setPromotions(prev => prev.filter(p => p.id !== promotion.id));
          setTotal(prev => prev - 1);
        } catch (err: any) {
          showError(err?.message || 'Không thể xóa khuyến mãi');
        }
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý khuyến mãi</h2>
          <p>{total > 0 ? `${total.toLocaleString('vi-VN')} mã khuyến mãi` : 'Không có mã khuyến mãi nào'}</p>
        </div>
        <button className="adm-btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Thêm khuyến mãi
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên khuyến mãi..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="adm-search-input"
          />
          {search && (
            <button className="adm-search-clear" onClick={() => handleSearch('')} tabIndex={-1}>×</button>
          )}
        </div>
        <button
          className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={15} />
          Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="adm-filters-panel" style={{ marginBottom: 16 }}>
          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
            className="adm-select"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {statusFilter && (
            <button className="adm-btn-ghost" onClick={() => { setStatusFilter(''); setPage(1); }}>
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
            <button className="adm-error-retry" onClick={loadPromotions}>Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Ticket size={32} /></div>
            <p className="adm-empty-title">Không có khuyến mãi nào</p>
            <p className="adm-empty-desc">
              {search || statusFilter ? 'Không tìm thấy khuyến mãi phù hợp' : 'Bắt đầu bằng cách thêm khuyến mãi đầu tiên'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên</th>
                    <th>Giảm giá</th>
                    <th>Đơn tối thiểu</th>
                    <th>Đã dùng / Giới hạn</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(promotion => {
                    const discount = getDiscountDisplay(promotion);
                    const status = getStatus(promotion);
                    const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.INACTIVE;
                    const usageLimit = promotion.usageLimit || 0;
                    const usedCount = promotion.usedCount || 0;
                    const usagePct = usageLimit > 0
                      ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
                      : 0;
                    const discountColor = promotion.discountType === 'PERCENT' || promotion.discountType === 'PERCENTAGE' ? '#7c3aed' : '#dc2626';

                    return (
                      <tr key={promotion.id}>
                        <td>
                          <div className="adm-code-badge">{promotion.code}</div>
                        </td>
                        <td>
                          <span style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>
                            {promotion.name || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: discountColor }}>
                              {discount.text}
                            </span>
                            {discount.sub && (
                              <span style={{ fontSize: 11, color: '#64748b' }}>{discount.sub}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {promotion.minOrderAmount && Number(promotion.minOrderAmount) > 0 ? (
                            <span style={{ color: '#475569', fontSize: 13 }}>
                              Từ {formatCurrency(Number(promotion.minOrderAmount))}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>Không giới hạn</span>
                          )}
                        </td>
                        <td>
                          <div className="adm-usage-cell">
                            <span style={{ fontSize: 12, color: '#475569' }}>
                              {usageLimit > 0 ? `${usedCount} / ${usageLimit}` : `${usedCount} lần`}
                            </span>
                            {usageLimit > 0 && (
                              <div className="adm-usage-bar">
                                <div
                                  className="adm-usage-fill"
                                  style={{
                                    width: `${usagePct}%`,
                                    background: usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#0891b2',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adm-date-range">
                            <Calendar size={12} />
                            <div>
                              <div style={{ fontSize: 12 }}>{formatDate(promotion.startAt)}</div>
                              <div style={{ fontSize: 12 }}>→ {formatDate(promotion.endAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-badge"
                            style={{ color: statusStyle.color, background: statusStyle.bg }}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Sửa khuyến mãi"
                              style={{ color: '#0891b2' }}
                              onClick={() => openEdit(promotion)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="adm-action-trigger"
                              title={promotion.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                              onClick={() => handleToggleActive(promotion)}
                              style={{ color: promotion.isActive ? '#f59e0b' : '#10b981' }}
                            >
                              <Tag size={15} />
                            </button>
                            <button
                              className="adm-action-trigger"
                              title="Xóa khuyến mãi"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDelete(promotion)}
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

            {/* Pagination */}
            {total > 0 && (
              <div className="adm-pagination">
                <span className="adm-pagination-info">
                  Hiển thị {startItem} – {endItem} trong {total.toLocaleString('vi-VN')} mã khuyến mãi
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isNear = Math.abs(pageNum - page) <= 1;
                    const isEnds = pageNum === 1 || pageNum === totalPages;
                    if (!isNear && !isEnds) return null;
                    return (
                      <button
                        key={pageNum}
                        className={`adm-pagination-btn ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="adm-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-header">
              <h3>{modalMode === 'create' ? 'Thêm khuyến mãi mới' : 'Chỉnh sửa khuyến mãi'}</h3>
              <button className="adm-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="adm-modal-body" style={{ padding: 20, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                <div className="adm-form-section">
                  <h4 className="adm-form-section-title">Thông tin cơ bản</h4>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label required">Mã giảm giá</label>
                      <input
                        type="text"
                        className={`adm-input ${formErrors.code ? 'adm-input-error' : ''}`}
                        value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                        placeholder="Ví dụ: SUMMER2026"
                        disabled={modalMode === 'edit'}
                      />
                      {formErrors.code && <small className="adm-form-error">{formErrors.code}</small>}
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label required">Tên chương trình</label>
                      <input
                        type="text"
                        className={`adm-input ${formErrors.name ? 'adm-input-error' : ''}`}
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ví dụ: Summer Sale 2026"
                      />
                      {formErrors.name && <small className="adm-form-error">{formErrors.name}</small>}
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Mô tả</label>
                    <textarea
                      className="adm-input adm-textarea"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="adm-form-section">
                  <h4 className="adm-form-section-title">
                    <Percent size={14} />
                    Giá trị giảm giá
                  </h4>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label required">Loại giảm</label>
                      <select
                        className="adm-select"
                        value={form.discountType}
                        onChange={e => setForm(f => ({ ...f, discountType: e.target.value as DiscountType }))}
                      >
                        {DISCOUNT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label required">
                        {form.discountType === 'PERCENT' ? 'Phần trăm giảm (%)' : form.discountType === 'FIXED_AMOUNT' ? 'Số tiền giảm (VNĐ)' : 'Giá trị giảm'}
                      </label>
                      <input
                        type="number"
                        className={`adm-input ${formErrors.discountValue ? 'adm-input-error' : ''}`}
                        value={form.discountValue}
                        onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                        placeholder={form.discountType === 'PERCENT' ? '10' : '50000'}
                        min={0}
                        step={form.discountType === 'PERCENT' ? 1 : 1000}
                      />
                      {formErrors.discountValue && <small className="adm-form-error">{formErrors.discountValue}</small>}
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label">Đơn hàng tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={form.minOrderAmount}
                        onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                        placeholder="0 = không giới hạn"
                        min={0}
                      />
                    </div>
                    {form.discountType === 'PERCENT' && (
                      <div className="adm-form-group">
                        <label className="adm-form-label">Giảm tối đa (VNĐ)</label>
                        <input
                          type="number"
                          className="adm-input"
                          value={form.maxDiscountAmount}
                          onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                          placeholder="0 = không giới hạn"
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="adm-form-section">
                  <h4 className="adm-form-section-title">
                    <Calendar size={14} />
                    Thời gian hiệu lực
                  </h4>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label required">Ngày bắt đầu</label>
                      <input
                        type="datetime-local"
                        className={`adm-input ${formErrors.startAt ? 'adm-input-error' : ''}`}
                        value={form.startAt}
                        onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                      />
                      {formErrors.startAt && <small className="adm-form-error">{formErrors.startAt}</small>}
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label required">Ngày kết thúc</label>
                      <input
                        type="datetime-local"
                        className={`adm-input ${formErrors.endAt ? 'adm-input-error' : ''}`}
                        value={form.endAt}
                        onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                      />
                      {formErrors.endAt && <small className="adm-form-error">{formErrors.endAt}</small>}
                    </div>
                  </div>
                </div>

                <div className="adm-form-section">
                  <h4 className="adm-form-section-title">
                    <Zap size={14} />
                    Giới hạn sử dụng
                  </h4>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label">Số lượt sử dụng tối đa</label>
                      <input
                        type="number"
                        className="adm-input"
                        value={form.usageLimit}
                        onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                        placeholder="0 = không giới hạn"
                        min={0}
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Trạng thái</label>
                      <label className="adm-toggle">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                        />
                        <span className="adm-toggle-slider" />
                        <span>{form.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="adm-btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : modalMode === 'create' ? 'Thêm khuyến mãi' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
