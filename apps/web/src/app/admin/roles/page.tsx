'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, ShieldCheck, Check, X, AlertTriangle,
  Eye, Search, Shield, ShieldOff, Loader2,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout-client';
import {
  fetchRoles, fetchPermissions, createRole, updateRole, deleteRole,
} from '@/lib/admin/api';

interface Permission {
  key: string;
  label: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

const PERM_CATEGORIES_ORDER = [
  'Dashboard', 'Orders', 'Products', 'Categories', 'Customers',
  'Promotions', 'Posts', 'Banners', 'Reviews', 'Delivery',
  'Inventory', 'Staff', 'Reports', 'Settings',
];

export default function RolesPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  // Data state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permViewRole, setPermViewRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#64748b',
    permissions: [] as string[],
  });

  // Load roles
  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoles({ search: search || undefined });
      setRoles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách vai trò');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Load permissions
  const loadPermissions = useCallback(async () => {
    try {
      const data = await fetchPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      // Silent fail for permissions
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadRoles, loadPermissions]);

  // Reset selected if it no longer exists
  useEffect(() => {
    if (selectedRole) {
      const stillExists = roles.find(r => r.id === selectedRole.id);
      if (!stillExists) setSelectedRole(null);
    }
  }, [roles, selectedRole]);

  // Compute KPIs
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.isActive).length;
  const inactiveRoles = roles.filter(r => !r.isActive).length;

  // Group permissions by category
  const permsByCategory: Record<string, Permission[]> = {};
  for (const p of permissions) {
    if (!permsByCategory[p.category]) permsByCategory[p.category] = [];
    permsByCategory[p.category].push(p);
  }

  const permCount = (role: Role) => role.permissions.length;

  const openAddModal = () => {
    setFormMode('add');
    setEditingRole(null);
    setFormData({ name: '', slug: '', description: '', color: '#64748b', permissions: [] });
    setShowFormModal(true);
  };

  const openEditModal = (role: Role) => {
    setFormMode('edit');
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      color: role.color,
      permissions: [...role.permissions],
    });
    setShowFormModal(true);
  };

  const handleTogglePerm = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSelectAllInCategory = (category: string) => {
    const catPerms = permsByCategory[category]?.map(p => p.key) || [];
    const allSelected = catPerms.every(k => formData.permissions.includes(k));
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(k => !catPerms.includes(k))
        : [...new Set([...prev.permissions, ...catPerms])],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Vui lòng nhập tên vai trò');
      return;
    }
    if (!formData.slug.trim()) {
      showError('Vui lòng nhập slug');
      return;
    }
    if (formData.permissions.length === 0) {
      showError('Vui lòng chọn ít nhất một quyền hạn');
      return;
    }

    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await createRole(formData);
        success('Tạo vai trò thành công');
      } else if (editingRole) {
        await updateRole(editingRole.id, formData);
        success('Cập nhật vai trò thành công');
      }
      setShowFormModal(false);
      loadRoles();
    } catch (e: any) {
      showError(e.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    confirm({
      title: 'Xóa vai trò',
      message: `Xóa vai trò "${role.name}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteRole(role.id);
          success('Đã xóa vai trò');
          if (selectedRole?.id === role.id) setSelectedRole(null);
          loadRoles();
        } catch (e: any) {
          showError(e.message || 'Không thể xóa vai trò');
        }
      },
    });
  };

  const handleToggleActive = async (role: Role) => {
    try {
      await updateRole(role.id, { isActive: !role.isActive });
      success(`Đã ${role.isActive ? 'vô hiệu hóa' : 'kích hoạt'} vai trò`);
      loadRoles();
    } catch (e: any) {
      showError(e.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Vai trò & Phân quyền</h2>
          <p>Quản lý vai trò và quyền hạn nhân viên trong hệ thống</p>
        </div>
        <button className="adm-btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          Thêm vai trò
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} color="#64748b" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng vai trò</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{loading ? '—' : totalRoles}</div>
            </div>
          </div>
        </div>
        <div className="adm-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} color="#15803d" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đang hoạt động</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{loading ? '—' : activeRoles}</div>
            </div>
          </div>
        </div>
        <div className="adm-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldOff size={22} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bị vô hiệu hóa</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{loading ? '—' : inactiveRoles}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, marginBottom: 20,
        fontSize: 13, color: '#1e40af',
      }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Vai trò hệ thống được bảo vệ.</strong>{' '}
          Các vai trò hệ thống (Admin, Quản lý, Nhân viên, Shipper) không thể xóa hoặc vô hiệu hóa.
          Bạn có thể tạo vai trò tùy chỉnh và gán quyền hạn theo nhu cầu.
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="adm-search-box">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            className="adm-search-input"
            placeholder="Tìm kiếm vai trò..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="adm-roles-layout">
        {/* Role List */}
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="adm-card-header">
            <h3><ShieldCheck size={16} /> Danh sách vai trò</h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>{roles.length} vai trò</span>
          </div>

          {loading ? (
            <div className="adm-empty">
              <Loader2 size={28} className="adm-spin" color="#94a3b8" />
              <p className="adm-empty-desc">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="adm-empty">
              <AlertTriangle size={28} color="#dc2626" />
              <p className="adm-empty-title">Lỗi</p>
              <p className="adm-empty-desc">{error}</p>
              <button className="adm-btn-primary" onClick={loadRoles}>Thử lại</button>
            </div>
          ) : roles.length === 0 ? (
            <div className="adm-empty">
              <ShieldCheck size={32} color="#c0c8d4" />
              <p className="adm-empty-title">Không có vai trò nào</p>
              <p className="adm-empty-desc">Thêm vai trò đầu tiên cho hệ thống</p>
            </div>
          ) : (
            <div className="adm-role-list">
              {roles.map(role => (
                <div
                  key={role.id}
                  className={`adm-role-item${selectedRole?.id === role.id ? ' active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="adm-role-color" style={{ background: role.color }} />
                  <div className="adm-role-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <b>{role.name}</b>
                      {role.isSystem && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px',
                          borderRadius: 4, background: '#fef3c7', color: '#92400e',
                          border: '1px solid #fcd34d',
                        }}>HỆ THỐNG</span>
                      )}
                      {!role.isActive && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px',
                          borderRadius: 4, background: '#fee2e2', color: '#991b1b',
                          border: '1px solid #fca5a5',
                        }}>TẮT</span>
                      )}
                    </div>
                    <span>{role.staffCount} nhân viên · {permCount(role)} quyền</span>
                  </div>
                  <div className="adm-role-actions">
                    <button
                      className="adm-action-btn"
                      title="Xem quyền"
                      onClick={e => {
                        e.stopPropagation();
                        setPermViewRole(role);
                        setShowPermModal(true);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="adm-action-btn"
                      title="Sửa"
                      onClick={e => {
                        e.stopPropagation();
                        openEditModal(role);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    {!role.isSystem && (
                      <>
                        <button
                          className="adm-action-btn"
                          title={role.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleActive(role);
                          }}
                        >
                          {role.isActive ? <ShieldOff size={14} /> : <Shield size={14} />}
                        </button>
                        <button
                          className="adm-action-btn adm-action-danger"
                          title="Xóa"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteRole(role);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Detail */}
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          {selectedRole ? (
            <>
              <div className="adm-card-header">
                <h3><ShieldCheck size={16} /> {selectedRole.name}</h3>
                {!selectedRole.isSystem && (
                  <button
                    className="adm-action-trigger"
                    title="Sửa vai trò"
                    onClick={() => openEditModal(selectedRole)}
                  >
                    <Edit2 size={15} />
                  </button>
                )}
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: selectedRole.color, flexShrink: 0,
                    }} />
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{selectedRole.name}</strong>
                    {selectedRole.isSystem && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px',
                        borderRadius: 4, background: '#fef3c7', color: '#92400e',
                        border: '1px solid #fcd34d',
                      }}>HỆ THỐNG</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 0 20px', lineHeight: 1.5 }}>
                    {selectedRole.description || 'Không có mô tả'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Số quyền</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{permCount(selectedRole)}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Nhân viên</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{selectedRole.staffCount}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Trạng thái</div>
                    <div style={{ fontSize: selectedRole.isActive ? 14 : 11, fontWeight: 700, color: selectedRole.isActive ? '#15803d' : '#dc2626' }}>
                      {selectedRole.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Danh sách quyền hạn</span>
                    <button
                      className="adm-btn-ghost"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                      onClick={() => { setPermViewRole(selectedRole); setShowPermModal(true); }}
                    >
                      <Eye size={13} style={{ marginRight: 4 }} />
                      Xem chi tiết
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedRole.permissions.map(pKey => {
                      const perm = permissions.find(p => p.key === pKey);
                      return (
                        <span
                          key={pKey}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 6,
                            background: '#ecfeff', color: '#0891b2',
                            fontSize: 11, fontWeight: 600, border: '1px solid #a5f3fc',
                          }}
                        >
                          <Check size={10} />
                          {perm?.label || pKey}
                        </span>
                      );
                    })}
                    {selectedRole.permissions.length === 0 && (
                      <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Chưa có quyền nào</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="adm-empty-state">
              <ShieldCheck size={40} strokeWidth={1} color="#c0c8d4" />
              <p>Chọn một vai trò để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="adm-modal-overlay" onClick={() => !submitting && setShowFormModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '100%' }}>
            <div className="adm-modal-header">
              <h3><ShieldCheck size={16} style={{ marginRight: 8 }} />{formMode === 'add' ? 'Thêm vai trò mới' : 'Sửa vai trò'}</h3>
              <button className="adm-modal-close" onClick={() => setShowFormModal(false)} disabled={submitting}><X size={18} /></button>
            </div>

            <div style={{ padding: '0 24px 16px' }}>
              {/* Name & Slug */}
              <div className="adm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="adm-label">Tên vai trò <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="adm-input"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Kế toán"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="adm-label">Slug <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="adm-input"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                    placeholder="VD: ACCOUNTANT"
                    disabled={submitting || formMode === 'edit'}
                  />
                  {formMode === 'edit' && <p className="adm-form-hint">Slug không thể thay đổi</p>}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginTop: 12 }}>
                <label className="adm-label">Mô tả</label>
                <input
                  type="text"
                  className="adm-input"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về vai trò này..."
                  disabled={submitting}
                />
              </div>

              {/* Color */}
              <div style={{ marginTop: 12 }}>
                <label className="adm-label">Màu hiển thị</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                    disabled={submitting}
                  />
                  <input
                    type="text"
                    className="adm-input"
                    value={formData.color}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#64748b"
                    style={{ flex: 1 }}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div style={{ padding: '0 24px 16px', maxHeight: 380, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label className="adm-label" style={{ marginBottom: 0 }}>
                  Quyền hạn ({formData.permissions.length} đã chọn)
                </label>
                <button
                  type="button"
                  className="adm-btn-ghost"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    permissions: prev.permissions.length === permissions.length ? [] : permissions.map(p => p.key),
                  }))}
                >
                  {formData.permissions.length === permissions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              {PERM_CATEGORIES_ORDER.map(category => {
                const catPerms = permsByCategory[category];
                if (!catPerms || catPerms.length === 0) return null;
                const allSelected = catPerms.every(p => formData.permissions.includes(p.key));

                return (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 6, paddingBottom: 4,
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span>{category}</span>
                      <button
                        type="button"
                        className="adm-btn-ghost"
                        style={{ fontSize: 10, padding: '1px 6px', height: 'auto' }}
                        onClick={() => handleSelectAllInCategory(category)}
                      >
                        {allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {catPerms.map(perm => {
                        const granted = formData.permissions.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            onClick={() => !submitting && handleTogglePerm(perm.key)}
                            className={`adm-perm-item${granted ? ' granted' : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="adm-perm-check">
                              {granted && <Check size={12} />}
                            </div>
                            <span className="adm-perm-label">{perm.label}</span>
                            <code className="adm-perm-key">{perm.key}</code>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-secondary" onClick={() => setShowFormModal(false)} disabled={submitting}>
                Hủy
              </button>
              <button className="adm-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 size={14} className="adm-spin" style={{ marginRight: 6 }} /> Đang lưu...</> : (
                  formMode === 'add' ? 'Tạo vai trò' : 'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {showPermModal && permViewRole && (
        <div className="adm-modal-overlay" onClick={() => setShowPermModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="adm-modal-header">
              <h3><ShieldCheck size={16} style={{ marginRight: 8 }} />Quyền hạn — {permViewRole.name}</h3>
              <button className="adm-modal-close" onClick={() => setShowPermModal(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '0 24px 16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b',
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: permViewRole.color, flexShrink: 0,
                }} />
                {permViewRole.name} — {permCount(permViewRole)} quyền hạn
                {permViewRole.isSystem && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>(Vai trò hệ thống)</span>}
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', maxHeight: 400, overflowY: 'auto' }}>
              {PERM_CATEGORIES_ORDER.map(category => {
                const catPerms = permsByCategory[category];
                if (!catPerms || catPerms.length === 0) return null;

                return (
                  <div key={category} style={{ marginBottom: 20 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 8, paddingBottom: 6,
                      borderBottom: '1px solid #f1f5f9',
                    }}>{category}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {catPerms.map(perm => {
                        const granted = permViewRole.permissions.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            className={`adm-perm-item${granted ? ' granted' : ''}`}
                            style={{ cursor: 'default' }}
                          >
                            <div className="adm-perm-check">
                              {granted && <Check size={14} />}
                            </div>
                            <span className="adm-perm-label">{perm.label}</span>
                            <code className="adm-perm-key">{perm.key}</code>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-primary" onClick={() => setShowPermModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
