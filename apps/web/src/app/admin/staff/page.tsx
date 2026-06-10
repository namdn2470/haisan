'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Lock, Unlock,
  Mail, Phone, ShieldCheck, AlertTriangle, X, UserX,
  Shield, Users,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import { fetchStaff, createStaff, updateStaff, toggleStaffStatus, deleteStaff } from '@/lib/admin/api';

interface StaffMember {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'MANAGER', label: 'MANAGER' },
  { value: 'STAFF', label: 'STAFF' },
  { value: 'SHIPPER', label: 'SHIPPER' },
];

const ROLE_CREATE_OPTIONS = [
  { value: 'MANAGER', label: 'MANAGER', desc: 'Quản lý cao cấp, toàn quyền hệ thống' },
  { value: 'ADMIN', label: 'ADMIN', desc: 'Quản trị viên, quản lý hệ thống' },
  { value: 'STAFF', label: 'STAFF', desc: 'Nhân viên thường, hỗ trợ đơn hàng' },
  { value: 'SHIPPER', label: 'SHIPPER', desc: 'Nhân viên giao hàng' },
];

const ROLE_STYLE: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  SUPER_ADMIN: { label: 'SUPER_ADMIN', color: '#7c3aed', bg: '#faf5ff', desc: 'Toàn quyền' },
  ADMIN: { label: 'ADMIN', color: '#7c3aed', bg: '#faf5ff', desc: 'Quản trị viên' },
  MANAGER: { label: 'MANAGER', color: '#15803d', bg: '#f0fdf4', desc: 'Quản lý' },
  STAFF: { label: 'STAFF', color: '#1d4ed8', bg: '#eff6ff', desc: 'Nhân viên' },
  SHIPPER: { label: 'SHIPPER', color: '#0891b2', bg: '#ecfeff', desc: 'Giao hàng' },
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Hoạt động', color: '#10b981', bg: '#d1fae5' },
  BLOCKED: { label: 'Bị khóa', color: '#ef4444', bg: '#fee2e2' },
};

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

export default function StaffPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'STAFF',
    status: 'ACTIVE',
    password: '',
  });

  const limit = 15;

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStaff({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setStaff(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách nhân viên';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleDelete = useCallback((member: StaffMember) => {
    const rs = ROLE_STYLE[member.role] || { label: member.role };

    if (member.role === 'SUPER_ADMIN') {
      showError('Không thể xóa tài khoản SUPER_ADMIN');
      return;
    }

    confirm({
      title: 'Xóa nhân viên',
      message: `Xóa vĩnh viễn tài khoản "${member.fullName || 'nhân viên'}" (${rs.label})? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteStaff(member.id);
          success('Đã xóa nhân viên');
          setStaff(prev => prev.filter(s => s.id !== member.id));
          setTotal(prev => prev - 1);
        } catch (err: any) {
          showError(err?.message || 'Không thể xóa nhân viên');
        }
      },
    });
  }, [confirm, success, showError]);

  const handleToggleStatus = useCallback((member: StaffMember) => {
    const isBlocking = member.status === 'ACTIVE';
    confirm({
      title: isBlocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: isBlocking
        ? `Khóa tài khoản "${member.fullName || 'nhân viên'}"? Nhân viên sẽ không thể đăng nhập.`
        : `Mở khóa tài khoản "${member.fullName || 'nhân viên'}"?`,
      confirmText: isBlocking ? 'Khóa' : 'Mở khóa',
      cancelText: 'Hủy',
      type: 'warning',
      onConfirm: async () => {
        try {
          await toggleStaffStatus(member.id);
          success(isBlocking ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
          setStaff(prev =>
            prev.map(s => s.id === member.id
              ? { ...s, status: isBlocking ? 'BLOCKED' : 'ACTIVE' }
              : s
            )
          );
        } catch (err: any) {
          showError(err?.message || 'Không thể cập nhật trạng thái');
        }
      },
    });
  }, [confirm, success, showError]);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({ fullName: '', phone: '', email: '', role: 'STAFF', status: 'ACTIVE', password: '' });
    setShowModal(true);
  };

  const openEditModal = async (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      fullName: member.fullName || '',
      phone: member.phone || '',
      email: member.email || '',
      role: member.role,
      status: member.status,
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showError('Vui lòng nhập tên nhân viên');
      return;
    }
    if (!formData.phone.trim()) {
      showError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!editingStaff && !formData.password.trim()) {
      showError('Vui lòng nhập mật khẩu');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setFormLoading(true);
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        role: formData.role,
      };
      if (editingStaff) {
        payload.status = formData.status;
        if (formData.password) payload.password = formData.password;
        await updateStaff(editingStaff.id, payload);
        success('Đã cập nhật thông tin nhân viên');
        setStaff(prev =>
          prev.map(s => s.id === editingStaff.id
            ? { ...s, ...payload, updatedAt: new Date().toISOString() }
            : s
          )
        );
      } else {
        payload.password = formData.password;
        await createStaff(payload);
        success('Đã thêm nhân viên mới');
        loadStaff();
      }
      setShowModal(false);
    } catch (err: any) {
      showError(err?.message || 'Không thể lưu thông tin nhân viên');
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  const activeCount = staff.filter(s => s.status === 'ACTIVE').length;
  const blockedCount = staff.filter(s => s.status === 'BLOCKED').length;

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý nhân viên</h2>
          <p>
            {total > 0
              ? `${total.toLocaleString('vi-VN')} nhân viên — ${activeCount} đang hoạt động, ${blockedCount} bị khóa`
              : 'Chưa có nhân viên nào'}
          </p>
        </div>
        <button className="adm-btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng nhân viên', value: total, color: '#1d4ed8', bg: '#eff6ff', icon: <Users size={20} color="#1d4ed8" /> },
          { label: 'Đang hoạt động', value: activeCount, color: '#10b981', bg: '#d1fae5', icon: <ShieldCheck size={20} color="#10b981" /> },
          { label: 'Bị khóa', value: blockedCount, color: '#ef4444', bg: '#fee2e2', icon: <Lock size={20} color="#ef4444" /> },
        ].map(kpi => (
          <div key={kpi.label} className="adm-kpi-card-v2">
            <div className="adm-kpi-icon-wrap" style={{ background: kpi.bg }}>
              {kpi.icon}
            </div>
            <div className="adm-kpi-body-v2">
              <span className="adm-kpi-label-v2">{kpi.label}</span>
              <span className="adm-kpi-value-v2" style={{ color: kpi.color }}>{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="adm-search-input"
          />
          {search && (
            <button className="adm-search-clear" onClick={() => setSearch('')} tabIndex={-1}>×</button>
          )}
        </div>
        <button
          className={`adm-btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Search size={15} />
          Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="adm-select"
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="adm-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="BLOCKED">Bị khóa</option>
          </select>
          {(search || roleFilter || statusFilter) && (
            <button className="adm-btn-ghost" onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
              setPage(1);
            }}>
              Xóa lọc
            </button>
          )}
        </div>
      )}

      {/* Role Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
        <span style={{ color: '#64748b', fontWeight: 600, marginRight: 4 }}>Vai trò:</span>
        {Object.entries(ROLE_STYLE).map(([key, val]) => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: val.color }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: 2,
              background: val.bg, border: `1px solid ${val.color}`,
            }} />
            {val.label}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="adm-loading-spinner" style={{ padding: 60 }} />
        ) : error ? (
          <div className="adm-error">
            <div className="adm-error-icon"><AlertTriangle size={24} /></div>
            <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
            <p className="adm-error-desc">{error}</p>
            <button className="adm-error-retry" onClick={loadStaff}>Thử lại</button>
          </div>
        ) : staff.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><UserX size={32} /></div>
            <p className="adm-empty-title">Không có nhân viên nào</p>
            <p className="adm-empty-desc">
              {search || roleFilter || statusFilter
                ? 'Không tìm thấy nhân viên phù hợp'
                : 'Bắt đầu bằng cách thêm nhân viên đầu tiên'}
            </p>
            {!search && !roleFilter && !statusFilter && (
              <button className="adm-btn-primary" style={{ marginTop: 12 }} onClick={openAddModal}>
                <Plus size={16} /> Thêm nhân viên
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member => {
                    const rs = ROLE_STYLE[member.role] || {
                      label: member.role, color: '#64748b', bg: '#f1f5f9',
                    };
                    const ss = STATUS_STYLE[member.status] || {
                      label: member.status, color: '#64748b', bg: '#f1f5f9',
                    };
                    const avatarChar = (member.fullName || 'N').charAt(0).toUpperCase();

                    return (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: rs.bg, border: `2px solid ${rs.color}30`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 14, color: rs.color, flexShrink: 0,
                            }}>
                              {avatarChar}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                                {member.fullName || 'Nhân viên'}
                              </div>
                              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                                ID: {member.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>
                            {member.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                <Phone size={12} style={{ flexShrink: 0, color: '#94a3b8' }} />
                                <span style={{ color: '#475569' }}>{member.phone}</span>
                              </div>
                            )}
                            {member.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Mail size={12} style={{ flexShrink: 0, color: '#94a3b8' }} />
                                <span style={{ color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                  {member.email}
                                </span>
                              </div>
                            )}
                            {!member.phone && !member.email && (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                              color: rs.color, background: rs.bg,
                              border: `1px solid ${rs.color}30`,
                            }}
                          >
                            <Shield size={12} />
                            {rs.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{ color: ss.color, background: ss.bg }}
                          >
                            {ss.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            {formatDate(member.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            {member.role !== 'SUPER_ADMIN' && (
                              <>
                                <button
                                  className="adm-action-trigger"
                                  title="Sửa"
                                  onClick={() => openEditModal(member)}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title={member.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                                  onClick={() => handleToggleStatus(member)}
                                  style={member.status === 'BLOCKED' ? { color: '#10b981' } : {}}
                                >
                                  {member.status === 'ACTIVE' ? (
                                    <Lock size={15} />
                                  ) : (
                                    <Unlock size={15} />
                                  )}
                                </button>
                                <button
                                  className="adm-action-trigger"
                                  title="Xóa"
                                  style={{ color: '#ef4444' }}
                                  onClick={() => handleDelete(member)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                            {member.role === 'SUPER_ADMIN' && (
                              <span style={{ fontSize: 11, color: '#94a3b8', padding: '4px 8px', background: '#f8fafc', borderRadius: 6 }}>
                                Bảo vệ
                              </span>
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
                <span className="adm-pagination-info">
                  Hiển thị {startItem} – {endItem} trong {total.toLocaleString('vi-VN')} nhân viên
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >‹</button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isNear = Math.abs(pageNum - page) <= 1;
                    const isFirstOrLast = pageNum === 1 || pageNum === totalPages;
                    if (!isNear && !isFirstOrLast) return null;
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
                  >›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="adm-modal-header">
              <h3>{editingStaff ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
              <button className="adm-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="adm-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="adm-form-label">
                      Họ tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="Nhập họ tên..."
                      value={formData.fullName}
                      onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="adm-form-input"
                      placeholder="0909 123 456"
                      value={formData.phone}
                      onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Email</label>
                    <input
                      type="email"
                      className="adm-form-input"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  {/* Role selector */}
                  <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="adm-form-label">
                      Vai trò <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {ROLE_CREATE_OPTIONS.map(opt => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 12px',
                            border: `1.5px solid ${formData.role === opt.value ? '#0891b2' : '#e2e8f0'}`,
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: formData.role === opt.value ? '#ecfeff' : '#fff',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={opt.value}
                            checked={formData.role === opt.value}
                            onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                            style={{ marginTop: 4, accentColor: '#0891b2' }}
                          />
                          <div>
                            <div style={{
                              fontWeight: 600, fontSize: 13,
                              color: formData.role === opt.value ? '#0891b2' : '#0f172a',
                            }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              {opt.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status toggle (edit mode only) */}
                  {editingStaff && (
                    <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="adm-form-label">Trạng thái tài khoản</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { value: 'ACTIVE', label: 'Hoạt động', color: '#10b981' },
                          { value: 'BLOCKED', label: 'Bị khóa', color: '#ef4444' },
                        ].map(opt => (
                          <label
                            key={opt.value}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '10px',
                              border: `1.5px solid ${formData.status === opt.value ? opt.color : '#e2e8f0'}`,
                              borderRadius: 8,
                              cursor: 'pointer',
                              background: formData.status === opt.value ? opt.color + '15' : '#fff',
                              color: formData.status === opt.value ? opt.color : '#64748b',
                              fontWeight: formData.status === opt.value ? 600 : 400,
                              fontSize: 13,
                              transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="radio"
                              name="status"
                              value={opt.value}
                              checked={formData.status === opt.value}
                              onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                              style={{ display: 'none' }}
                            />
                            {opt.value === 'ACTIVE' ? <Unlock size={14} /> : <Lock size={14} />}
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="adm-form-label">
                      Mật khẩu
                      {!editingStaff && <span style={{ color: '#ef4444' }}> *</span>}
                      {editingStaff && <span className="adm-form-hint" style={{ marginLeft: 8 }}>Để trống nếu không đổi</span>}
                    </label>
                    <input
                      type="password"
                      className="adm-form-input"
                      placeholder={editingStaff ? 'Nhập mật khẩu mới...' : 'Nhập mật khẩu...'}
                      value={formData.password}
                      onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                      required={!editingStaff}
                      minLength={6}
                    />
                    <span className="adm-form-hint">
                      Tối thiểu 6 ký tự. {!editingStaff ? 'Sẽ được gửi cho nhân viên sau khi tạo.' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-ghost" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="adm-btn-primary" disabled={formLoading}>
                  {formLoading ? 'Đang xử lý...' : editingStaff ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
