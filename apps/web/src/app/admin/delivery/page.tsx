'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, AlertTriangle, Eye, Truck,
  MapPin, Phone, User, Clock, X, ChevronDown,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import {
  fetchDeliveries, assignDelivery, updateDeliveryStatus, fetchStaff,
  fetchShippingZones, createShippingZone,
  updateShippingZone, deleteShippingZone,
} from '@/lib/admin/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ giao' },
  { value: 'ASSIGNED', label: 'Đã giao cho shipper' },
  { value: 'PICKED_UP', label: 'Đã lấy hàng' },
  { value: 'DELIVERING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao thành công' },
  { value: 'FAILED', label: 'Giao thất bại' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ giao', color: '#a16207', bg: '#fefce8' },
  ASSIGNED: { label: 'Đã giao shipper', color: '#1d4ed8', bg: '#eff6ff' },
  PICKED_UP: { label: 'Đã lấy hàng', color: '#7c3aed', bg: '#faf5ff' },
  DELIVERING: { label: 'Đang giao', color: '#0891b2', bg: '#ecfeff' },
  DELIVERED: { label: 'Đã giao', color: '#15803d', bg: '#f0fdf4' },
  FAILED: { label: 'Thất bại', color: '#dc2626', bg: '#fef2f2' },
};

const NEXT_STATUS: Record<string, { next: string; label: string; color: string }> = {
  PENDING: { next: 'ASSIGNED', label: 'Giao cho shipper', color: '#1d4ed8' },
  ASSIGNED: { next: 'PICKED_UP', label: 'Đã lấy hàng', color: '#7c3aed' },
  PICKED_UP: { next: 'DELIVERING', label: 'Bắt đầu giao', color: '#0891b2' },
  DELIVERING: { next: 'DELIVERED', label: 'Đã giao xong', color: '#15803d' },
  DELIVERED: { next: 'DELIVERED', label: 'Hoàn thành', color: '#15803d' },
  FAILED: { next: 'FAILED', label: 'Giao lại', color: '#dc2626' },
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
}

// ============================================================
// Shipping Zone Types
// ============================================================
interface ShippingZone {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  shippingFee: number;
  freeFromAmount: number;
  estimatedDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Delivery Order Types
// ============================================================
interface DeliveryOrder {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  address: string;
  shipperId?: string;
  shipperName?: string;
  status: string;
  estimatedDelivery?: string;
  createdAt?: string;
}

interface Staff {
  id: string;
  fullName?: string;
  name?: string;
  phone?: string;
}

// ============================================================
// Zone Form Component
// ============================================================
interface ZoneFormProps {
  zone?: ShippingZone | null;
  onClose: () => void;
  onSave: () => void;
  showError: (msg: string) => void;
}

function ZoneForm({ zone, onClose, onSave, showError }: ZoneFormProps) {
  const { success } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: zone?.name || '',
    province: zone?.province || '',
    district: zone?.district || '',
    shippingFee: zone?.shippingFee?.toString() || '0',
    freeFromAmount: zone?.freeFromAmount?.toString() || '0',
    estimatedDays: zone?.estimatedDays?.toString() || '1',
    isActive: zone?.isActive !== false,
    sortOrder: zone?.sortOrder?.toString() || '0',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    const fee = parseFloat(form.shippingFee);
    const freeFrom = parseFloat(form.freeFromAmount);
    const days = parseInt(form.estimatedDays);
    if (isNaN(fee) || fee < 0) newErrors.shippingFee = true;
    if (isNaN(freeFrom) || freeFrom < 0) newErrors.freeFromAmount = true;
    if (isNaN(days) || days < 0) newErrors.estimatedDays = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: form.name.trim(),
        province: form.province.trim() || null,
        district: form.district.trim() || null,
        shippingFee: parseFloat(form.shippingFee),
        freeFromAmount: parseFloat(form.freeFromAmount),
        estimatedDays: parseInt(form.estimatedDays),
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
      };
      if (zone) {
        await updateShippingZone(zone.id, data);
        success('Đã cập nhật khu vực giao hàng');
      } else {
        await createShippingZone(data);
        success('Đã thêm khu vực giao hàng');
      }
      onSave();
      onClose();
    } catch (err: any) {
      showError(err?.message || 'Không thể lưu khu vực giao hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="adm-modal-header">
          <h3><MapPin size={16} style={{ marginRight: 8 }} />{zone ? 'Sửa khu vực' : 'Thêm khu vực giao hàng'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label className="adm-form-label">Tên khu vực <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className={`adm-input ${errors.name ? 'error' : ''}`}
                placeholder="Ví dụ: Nội thành HCM"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: false })); }}
              />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label className="adm-form-label">Tỉnh / Thành phố</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Ví dụ: TP. Hồ Chí Minh"
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Quận / Huyện</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Ví dụ: Quận 1"
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label className="adm-form-label">Phí giao hàng (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                className={`adm-input ${errors.shippingFee ? 'error' : ''}`}
                placeholder="0"
                min="0"
                value={form.shippingFee}
                onChange={e => { setForm(f => ({ ...f, shippingFee: e.target.value })); setErrors(er => ({ ...er, shippingFee: false })); }}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Miễn phí ship từ (VNĐ)</label>
              <input
                type="number"
                className={`adm-input ${errors.freeFromAmount ? 'error' : ''}`}
                placeholder="0 = không miễn phí"
                min="0"
                value={form.freeFromAmount}
                onChange={e => { setForm(f => ({ ...f, freeFromAmount: e.target.value })); setErrors(er => ({ ...er, freeFromAmount: false })); }}
              />
              {parseFloat(form.freeFromAmount) > 0 && (
                <span className="adm-form-hint">Đơn từ {formatPrice(parseFloat(form.freeFromAmount))} được miễn phí ship</span>
              )}
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label className="adm-form-label">Giao trong (ngày) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                className={`adm-input ${errors.estimatedDays ? 'error' : ''}`}
                placeholder="1"
                min="0"
                value={form.estimatedDays}
                onChange={e => { setForm(f => ({ ...f, estimatedDays: e.target.value })); setErrors(er => ({ ...er, estimatedDays: false })); }}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Thứ tự hiển thị</label>
              <input
                type="number"
                className="adm-input"
                placeholder="0"
                min="0"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <div className="adm-form-group">
            <label className="adm-form-label">Trạng thái</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: true }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  border: form.isActive ? '2px solid #10b981' : '2px solid #e2e8f0',
                  background: form.isActive ? '#f0fdf4' : '#fff',
                  color: form.isActive ? '#15803d' : '#64748b',
                  fontWeight: 600,
                }}
              >
                <ToggleRight size={20} />
                Hoạt động
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: false }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  border: !form.isActive ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  background: !form.isActive ? '#fef2f2' : '#fff',
                  color: !form.isActive ? '#dc2626' : '#64748b',
                  fontWeight: 600,
                }}
              >
                <ToggleLeft size={20} />
                Tạm ngừng
              </button>
            </div>
          </div>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn-ghost" onClick={onClose}>Hủy</button>
          <button className="adm-btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Đang lưu...' : zone ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shipping Zones Tab
// ============================================================
function ShippingZonesTab() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const result = await fetchShippingZones({ search: search || undefined, isActive }) as { data: ShippingZone[] };
      setZones(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khu vực giao hàng');
      showError(err.message || 'Không thể tải danh sách khu vực giao hàng');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showError]);

  useEffect(() => { loadZones(); }, [loadZones]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => loadZones(), 400);
    setSearchTimeout(t);
  };

  const handleToggleActive = (zone: ShippingZone) => {
    const newActive = !zone.isActive;
    confirm({
      title: newActive ? 'Kích hoạt khu vực' : 'Tạm ngừng khu vực',
      message: `${newActive ? 'Kích hoạt' : 'Tạm ngừng'} khu vực "${zone.name}"?`,
      confirmText: newActive ? 'Kích hoạt' : 'Tạm ngừng',
      type: newActive ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          await updateShippingZone(zone.id, { isActive: newActive });
          success(newActive ? 'Đã kích hoạt khu vực' : 'Đã tạm ngừng khu vực');
          loadZones();
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const handleDelete = (zone: ShippingZone) => {
    confirm({
      title: 'Xóa khu vực giao hàng',
      message: `Xóa vĩnh viễn khu vực "${zone.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteShippingZone(zone.id);
          success('Đã xóa khu vực giao hàng');
          loadZones();
        } catch (err: any) {
          showError(err.message || 'Không thể xóa khu vực giao hàng');
        }
      },
    });
  };

  const handleMove = async (zone: ShippingZone, direction: 'up' | 'down') => {
    const idx = zones.findIndex(z => z.id === zone.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === zones.length - 1) return;
    const newSortOrder = direction === 'up' ? zone.sortOrder - 1 : zone.sortOrder + 1;
    try {
      await updateShippingZone(zone.id, { sortOrder: newSortOrder });
      loadZones();
    } catch (err: any) {
      showError(err.message || 'Không thể sắp xếp');
    }
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingZone(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingZone(null);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên, tỉnh, quận..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="adm-search-input"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <Filter size={15} />
            Bộ lọc
          </button>
          <button className="adm-btn-primary" onClick={handleAdd}>
            <Plus size={15} />
            Thêm khu vực
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="adm-filter-row">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); }}
            className="adm-select"
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm ngừng</option>
          </select>
          {statusFilter && (
            <button className="adm-btn-ghost" onClick={() => setStatusFilter('')}>Xóa lọc</button>
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
            <button className="adm-error-retry" onClick={loadZones}>Thử lại</button>
          </div>
        ) : zones.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><MapPin size={32} /></div>
            <p className="adm-empty-title">Chưa có khu vực giao hàng</p>
            <p className="adm-empty-desc">
              {search || statusFilter ? 'Không tìm thấy khu vực phù hợp' : 'Thêm khu vực giao hàng để bắt đầu'}
            </p>
            {!search && !statusFilter && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={handleAdd}>
                <Plus size={14} /> Thêm khu vực
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Thứ tự</th>
                  <th>Tên khu vực</th>
                  <th>Tỉnh / TP</th>
                  <th>Quận / Huyện</th>
                  <th style={{ textAlign: 'right' }}>Phí ship</th>
                  <th style={{ textAlign: 'right' }}>Miễn phí từ</th>
                  <th>Ngày giao</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <button className="adm-action-trigger" title="Lên" onClick={() => handleMove(zone, 'up')} style={{ padding: 1 }}>
                          <ArrowUp size={12} />
                        </button>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{zone.sortOrder}</span>
                        <button className="adm-action-trigger" title="Xuống" onClick={() => handleMove(zone, 'down')} style={{ padding: 1 }}>
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{zone.name}</div>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: 13 }}>{zone.province || '—'}</span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: 13 }}>{zone.district || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: '#0891b2' }}>
                        {zone.shippingFee === 0 ? (
                          <span style={{ color: '#10b981' }}>Miễn phí</span>
                        ) : formatPrice(zone.shippingFee)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: '#64748b', fontSize: 13 }}>
                        {zone.freeFromAmount === 0 ? '—' : formatPrice(zone.freeFromAmount)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: 13 }}>{zone.estimatedDays} ngày</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="adm-status-badge"
                        style={{
                          color: zone.isActive ? '#15803d' : '#6b7280',
                          background: zone.isActive ? '#f0fdf4' : '#f1f5f9',
                        }}
                      >
                        {zone.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          className="adm-action-trigger"
                          title={zone.isActive ? 'Tạm ngừng' : 'Kích hoạt'}
                          onClick={() => handleToggleActive(zone)}
                          style={{ color: zone.isActive ? '#ef4444' : '#10b981' }}
                        >
                          {zone.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button className="adm-action-trigger" title="Sửa" onClick={() => handleEdit(zone)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="adm-action-trigger" title="Xóa" onClick={() => handleDelete(zone)} style={{ color: '#ef4444' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone Form Modal */}
      {showForm && (
        <ZoneForm
          zone={editingZone}
          onClose={handleCloseForm}
          onSave={loadZones}
          showError={showError}
        />
      )}
    </div>
  );
}

// ============================================================
// Delivery Orders Tab (existing functionality)
// ============================================================
function DeliveryOrdersTab() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<DeliveryOrder | null>(null);
  const [selectedShipper, setSelectedShipper] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 15;

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDeliveries({ status: statusFilter || undefined, page, limit }) as { data: any[]; total: number };
      setDeliveries(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách giao hàng';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showError]);

  const loadShippers = useCallback(async () => {
    try {
      const result = await fetchStaff({ role: 'SHIPPER', limit: 100 }) as { data: Staff[] };
      setStaffList(result.data || []);
    } catch { setStaffList([]); }
  }, []);

  useEffect(() => { loadDeliveries(); }, [loadDeliveries]);
  useEffect(() => { loadShippers(); }, [loadShippers]);

  const handleViewOrder = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleOpenAssign = (order: DeliveryOrder) => {
    setAssigningOrder(order);
    setSelectedShipper(order.shipperId || '');
    setShowAssignModal(true);
  };

  const handleAssignShipper = async () => {
    if (!assigningOrder || !selectedShipper) { showError('Vui lòng chọn shipper'); return; }
    setActionLoading(true);
    try {
      await assignDelivery(assigningOrder.orderId, selectedShipper);
      const shipper = staffList.find(s => s.id === selectedShipper);
      success(`Đã giao đơn cho shipper "${shipper?.fullName || shipper?.name}"`);
      setShowAssignModal(false);
      setAssigningOrder(null);
      loadDeliveries();
    } catch (err: any) { showError(err?.message || 'Không thể giao đơn cho shipper'); }
    finally { setActionLoading(false); }
  };

  const handleUpdateStatus = (order: DeliveryOrder) => {
    const statusInfo = NEXT_STATUS[order.status];
    if (!statusInfo) return;
    confirm({
      title: 'Cập nhật trạng thái',
      message: `Chuyển đơn "${order.orderCode}" sang "${statusInfo.label}"?`,
      confirmText: statusInfo.label, cancelText: 'Hủy', type: 'info',
      onConfirm: async () => {
        try {
          await updateDeliveryStatus(order.orderId, statusInfo.next);
          success(`Đã cập nhật trạng thái đơn "${order.orderCode}"`);
          loadDeliveries();
        } catch (err: any) { showError(err?.message || 'Không thể cập nhật trạng thái'); }
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div>
      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
        <div style={{ flex: 1 }} />
        <button
          className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={15} />
          Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="adm-filter-row">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="adm-select">
            {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          {statusFilter && <button className="adm-btn-ghost" onClick={() => { setStatusFilter(''); setPage(1); }}>Xóa lọc</button>}
        </div>
      )}

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (<div className="adm-loading-spinner" style={{ padding: 60 }} />)
          : error ? (
            <div className="adm-error">
              <div className="adm-error-icon"><AlertTriangle size={24} /></div>
              <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
              <p className="adm-error-desc">{error}</p>
              <button className="adm-error-retry" onClick={loadDeliveries}>Thử lại</button>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-icon"><Truck size={32} /></div>
              <p className="adm-empty-title">Không có đơn giao hàng nào</p>
              <p className="adm-empty-desc">{statusFilter ? 'Không tìm thấy đơn phù hợp với bộ lọc' : 'Chưa có đơn hàng nào cần giao'}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Địa chỉ</th>
                      <th>Shipper</th><th>Trạng thái</th><th>Dự kiến</th>
                      <th style={{ textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(order => {
                      const st = STATUS_STYLE[order.status] || { label: order.status, color: '#64748b', bg: '#f1f5f9' };
                      return (
                        <tr key={order.id}>
                          <td><span className="adm-order-code">{order.orderCode}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={14} style={{ color: '#94a3b8' }} />
                              <span style={{ fontWeight: 500, color: '#0f172a' }}>{order.customerName || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={12} style={{ color: '#94a3b8' }} />
                              <span style={{ fontSize: 12 }}>{order.customerPhone || '—'}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <MapPin size={12} style={{ color: '#94a3b8', marginTop: 2 }} />
                              <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {order.address || '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {order.shipperName ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                <Truck size={12} style={{ color: '#0891b2' }} />
                                <span style={{ fontWeight: 500, color: '#0891b2' }}>{order.shipperName}</span>
                              </span>
                            ) : (
                              <button
                                className="adm-btn-ghost adm-btn-sm"
                                style={{ padding: '4px 10px', fontSize: 11, color: '#a16207', borderColor: '#fde68a', background: '#fefce8' }}
                                onClick={() => handleOpenAssign(order)}
                              >
                                <User size={11} />
                                Giao ngay
                              </button>
                            )}
                          </td>
                          <td>
                            <span className="adm-status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                              <Clock size={12} />
                              {formatDate(order.estimatedDelivery)}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button className="adm-action-trigger" title="Xem chi tiết" onClick={() => handleViewOrder(order)}><Eye size={15} /></button>
                              {!order.shipperId && order.status === 'PENDING' && (
                                <button className="adm-action-trigger" title="Giao cho shipper" style={{ color: '#0891b2' }} onClick={() => handleOpenAssign(order)}><Truck size={15} /></button>
                              )}
                              {order.status !== 'DELIVERED' && order.status !== 'FAILED' && (
                                <button className="adm-action-trigger" title={NEXT_STATUS[order.status]?.label || 'Cập nhật'} style={{ color: NEXT_STATUS[order.status]?.color || '#0891b2' }} onClick={() => handleUpdateStatus(order)}>
                                  <ChevronDown size={15} />
                                </button>
                              )}
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
                  <span className="adm-pagination-info">Hiển thị {startItem} – {endItem} trong {total.toLocaleString('vi-VN')} đơn</span>
                  <div className="adm-pagination-buttons">
                    <button className="adm-pagination-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
                    {page > 3 && <><button className="adm-pagination-btn" onClick={() => setPage(1)}>1</button>{page > 4 && <span className="adm-pagination-ellipsis">…</span>}</>}
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isNear = Math.abs(pageNum - page) <= 1;
                      const isFirstOrLast = pageNum === 1 || pageNum === totalPages;
                      if (!isNear && !isFirstOrLast) return null;
                      return (
                        <button key={pageNum} className={`adm-pagination-btn ${page === pageNum ? 'active' : ''}`} onClick={() => setPage(pageNum)}>{pageNum}</button>
                      );
                    })}
                    {page < totalPages - 2 && <><span className="adm-pagination-ellipsis">…</span><button className="adm-pagination-btn" onClick={() => setPage(totalPages)}>{totalPages}</button></>}
                    <button className="adm-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                </div>
              )}
            </>
          )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="adm-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="adm-modal-header">
              <h3><Truck size={16} style={{ marginRight: 8 }} />Chi tiết giao hàng</h3>
              <button className="adm-modal-close" onClick={() => setShowDetailModal(false)}><X size={18} /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Mã đơn hàng</span>
                <span style={{ fontWeight: 700, color: '#0891b2', fontSize: 15 }}>{selectedOrder.orderCode}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Trạng thái</span>
                <span className="adm-status-badge" style={{ color: STATUS_STYLE[selectedOrder.status]?.color || '#64748b', background: STATUS_STYLE[selectedOrder.status]?.bg || '#f1f5f9' }}>
                  {STATUS_STYLE[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Thông tin khách hàng</div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><User size={14} style={{ color: '#94a3b8' }} /><span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.customerName || '—'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Phone size={14} style={{ color: '#94a3b8' }} /><span style={{ color: '#334155', fontSize: 13 }}>{selectedOrder.customerPhone || '—'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={14} style={{ color: '#94a3b8', marginTop: 2 }} /><span style={{ color: '#64748b', fontSize: 13 }}>{selectedOrder.address || '—'}</span></div>
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Shipper</div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                  {selectedOrder.shipperName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={14} style={{ color: '#0891b2' }} /><span style={{ fontWeight: 600, color: '#0891b2' }}>{selectedOrder.shipperName}</span></div>
                  ) : (
                    <div><span style={{ color: '#a16207', fontSize: 13 }}>Chưa có shipper</span></div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Dự kiến giao</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{formatDate(selectedOrder.estimatedDelivery)}</span>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowDetailModal(false)}>Đóng</button>
              {!selectedOrder.shipperId && selectedOrder.status === 'PENDING' && (
                <button className="adm-btn-primary" onClick={() => { setShowDetailModal(false); handleOpenAssign(selectedOrder); }}>
                  <User size={14} /> Giao cho shipper
                </button>
              )}
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'FAILED' && (
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: NEXT_STATUS[selectedOrder.status]?.color || '#0891b2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { setShowDetailModal(false); handleUpdateStatus(selectedOrder); }}>
                  {NEXT_STATUS[selectedOrder.status]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Shipper Modal */}
      {showAssignModal && assigningOrder && (
        <div className="adm-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="adm-modal-header">
              <h3><Truck size={16} style={{ marginRight: 8 }} />Giao đơn cho shipper</h3>
              <button className="adm-modal-close" onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>
            <div className="adm-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#1e40af' }}>
                <span style={{ fontWeight: 700, color: '#0891b2' }}>{assigningOrder.orderCode}</span>
                <span>—</span><span>{assigningOrder.customerName}</span>
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Chọn shipper</label>
                <select className="adm-form-input adm-select" value={selectedShipper} onChange={e => setSelectedShipper(e.target.value)}>
                  <option value="">— Chọn shipper —</option>
                  {staffList.map(s => (<option key={s.id} value={s.id}>{s.fullName || s.name} {s.phone ? `(${s.phone})` : ''}</option>))}
                </select>
              </div>
              {selectedShipper && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13 }}>
                  <Truck size={14} style={{ color: '#15803d' }} />
                  <span style={{ fontWeight: 600, color: '#15803d' }}>{staffList.find(s => s.id === selectedShipper)?.fullName || staffList.find(s => s.id === selectedShipper)?.name}</span>
                  <span style={{ color: '#64748b' }}>sẽ nhận đơn giao này</span>
                </div>
              )}
              {staffList.length === 0 && (
                <div style={{ padding: '12px 16px', background: '#fefce8', borderRadius: 8, fontSize: 13, color: '#a16207' }}>Không có shipper nào trong hệ thống. Vui lòng thêm nhân viên giao hàng trước.</div>
              )}
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowAssignModal(false)}>Hủy</button>
              <button className="adm-btn-primary" disabled={!selectedShipper || actionLoading} onClick={handleAssignShipper}>
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận giao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'zones'>('zones');

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý Giao hàng</h2>
          <p>Quản lý khu vực giao hàng, phí ship và đơn giao</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'zones' ? '#0891b2' : '#64748b',
            borderBottom: activeTab === 'zones' ? '3px solid #0891b2' : '3px solid transparent',
            marginBottom: -2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MapPin size={16} />
          Khu vực giao hàng
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'orders' ? '#0891b2' : '#64748b',
            borderBottom: activeTab === 'orders' ? '3px solid #0891b2' : '3px solid transparent',
            marginBottom: -2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Truck size={16} />
          Đơn giao hàng
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'zones' ? <ShippingZonesTab /> : <DeliveryOrdersTab />}
    </div>
  );
}
