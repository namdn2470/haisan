'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Eye, Lock, Unlock, Phone, Mail,
  ShoppingCart, Clock, AlertTriangle, UserX, MapPin,
  X, Check, User,
  Package, Calendar, DollarSign,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import { fetchCustomers, updateCustomerStatus, fetchCustomerById, fetchCustomerOrders } from '@/lib/admin/api';

interface Customer {
  id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  status: string;
  role?: string;
  avatarUrl?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  created?: string;
  updatedAt?: string;
  addresses?: Address[];
  orders?: Order[];
  _count?: { orders: number };
}

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  orderItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    product?: { images: Array<{ imageUrl: string }> };
  }>;
}

interface CustomerDetail {
  id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  status: string;
  role?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  addresses: Address[];
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
}

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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr?: string): string {
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

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'BLOCKED', label: 'Bị khóa' },
];

const ORDER_STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: '#f59e0b', bg: '#fef3c7', label: 'Đơn mới' },
  CONFIRMED: { color: '#3b82f6', bg: '#dbeafe', label: 'Đã xác nhận' },
  PREPARING: { color: '#8b5cf6', bg: '#ede9fe', label: 'Đang chuẩn bị' },
  SHIPPING: { color: '#06b6d4', bg: '#cffafe', label: 'Đang giao' },
  COMPLETED: { color: '#10b981', bg: '#d1fae5', label: 'Hoàn thành' },
  CANCELLED: { color: '#ef4444', bg: '#fee2e2', label: 'Đã hủy' },
};

const PAYMENT_STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: '#f59e0b', bg: '#fef3c7', label: 'Chưa thanh toán' },
  PAID: { color: '#10b981', bg: '#d1fae5', label: 'Đã thanh toán' },
  REFUNDED: { color: '#ef4444', bg: '#fee2e2', label: 'Đã hoàn tiền' },
};

type ModalTab = 'info' | 'orders' | 'addresses';

export default function CustomersPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal state
  const [showDetail, setShowDetail] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('info');

  const limit = 15;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomers({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setCustomers(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách khách hàng';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showError]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const openDetail = async (customerId: string) => {
    setShowDetail(true);
    setDetailLoading(true);
    setActiveTab('info');
    try {
      const [customerRes, ordersRes] = await Promise.all([
        fetchCustomerById(customerId),
        fetchCustomerOrders(customerId),
      ]);
      const data = customerRes.data;
      setDetailCustomer({
        ...data,
        orders: ordersRes.data || [],
        totalOrders: data._count?.orders || 0,
        totalSpent: data.totalSpent || 0,
      });
    } catch (err: any) {
      showError(err?.message || 'Không thể tải chi tiết khách hàng');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailCustomer(null);
  };

  const handleToggleStatus = (customer: Customer) => {
    const isBlocking = customer.status === 'ACTIVE';
    const newStatus = isBlocking ? 'BLOCKED' : 'ACTIVE';

    confirm({
      title: isBlocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: isBlocking
        ? `Khóa tài khoản của "${customer.fullName || customer.name}"? Khách hàng sẽ không thể đặt hàng.`
        : `Mở khóa tài khoản của "${customer.fullName || customer.name}"?`,
      confirmText: isBlocking ? 'Khóa' : 'Mở khóa',
      cancelText: 'Hủy',
      type: 'warning',
      onConfirm: async () => {
        try {
          await updateCustomerStatus(customer.id, newStatus);
          success(isBlocking ? 'Đã khóa tài khoản khách hàng' : 'Đã mở khóa tài khoản khách hàng');
          setCustomers(prev =>
            prev.map(c => c.id === customer.id ? { ...c, status: newStatus } : c)
          );
          if (detailCustomer?.id === customer.id) {
            setDetailCustomer(prev => prev ? { ...prev, status: newStatus } : null);
          }
        } catch (err: any) {
          showError(err?.message || 'Không thể cập nhật trạng thái');
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
          <h2>Quản lý khách hàng</h2>
          <p>
            {total > 0
              ? `${total.toLocaleString('vi-VN')} khách hàng`
              : 'Không có khách hàng nào'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: showFilters ? 12 : 0 }}>
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="adm-search-input"
          />
          {search && (
            <button
              className="adm-search-clear"
              onClick={() => handleSearch('')}
              tabIndex={-1}
            >
              ×
            </button>
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
          {(statusFilter) && (
            <button
              className="adm-btn-ghost"
              onClick={() => { setStatusFilter(''); setPage(1); }}
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
            <button className="adm-error-retry" onClick={loadCustomers}>Thử lại</button>
          </div>
        ) : customers.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><UserX size={32} /></div>
            <p className="adm-empty-title">Không có khách hàng nào</p>
            <p className="adm-empty-desc">
              {search || statusFilter
                ? 'Không tìm thấy khách hàng phù hợp với bộ lọc'
                : 'Chưa có khách hàng nào đăng ký'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th style={{ textAlign: 'center' }}>Tổng đơn</th>
                    <th>Tổng chi tiêu</th>
                    <th>Trạng thái</th>
                    <th>Ngày tham gia</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => {
                    const name = customer.fullName || customer.name || 'Khách hàng';
                    const avatarChar = name.charAt(0).toUpperCase();
                    const statusColor = customer.status === 'ACTIVE'
                      ? { color: '#10b981', bg: '#d1fae5' }
                      : { color: '#ef4444', bg: '#fee2e2' };
                    const statusLabel = customer.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa';

                    return (
                      <tr key={customer.id}>
                        <td>
                          <div className="adm-customer-cell">
                            <div className="adm-customer-avatar">{avatarChar}</div>
                            <div>
                              <b style={{ color: '#0f172a', fontWeight: 600 }}>{name}</b>
                              <small style={{ color: '#64748b' }}>ID: {customer.id.slice(0, 8)}...</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="adm-contact-list">
                            {customer.phone ? (
                              <div><Phone size={12} style={{ marginRight: 4, flexShrink: 0 }} />{customer.phone}</div>
                            ) : null}
                            {customer.email ? (
                              <div>
                                <Mail size={12} style={{ marginRight: 4, flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, display: 'inline-block' }}>
                                  {customer.email}
                                </span>
                              </div>
                            ) : null}
                            {!customer.phone && !customer.email && (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="adm-order-count" style={{ justifyContent: 'center' }}>
                            <ShoppingCart size={12} />
                            {customer.totalOrders ?? 0} đơn
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#059669', fontWeight: 700 }}>
                            {formatCurrency(customer.totalSpent ?? 0)}
                          </span>
                        </td>
                        <td>
                          <span className="adm-badge" style={{ color: statusColor.color, background: statusColor.bg }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className="adm-date-cell">
                            <Clock size={12} />
                            {formatShortDate(customer.createdAt || customer.created)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Xem chi tiết"
                              onClick={() => openDetail(customer.id)}
                            >
                              <Eye size={15} />
                            </button>
                            <Link
                              href={`/admin/orders?customerId=${customer.id}`}
                              className="adm-action-trigger"
                              title="Xem đơn hàng"
                            >
                              <ShoppingCart size={15} />
                            </Link>
                            <button
                              className="adm-action-trigger"
                              title={customer.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              onClick={() => handleToggleStatus(customer)}
                              style={customer.status === 'BLOCKED' ? { color: '#10b981' } : {}}
                            >
                              {customer.status === 'ACTIVE' ? <Lock size={15} /> : <Unlock size={15} />}
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
                  Hiển thị {startItem} – {endItem} trong {total.toLocaleString('vi-VN')} khách hàng
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>

                  {page > 3 && (
                    <>
                      <button className="adm-pagination-btn" onClick={() => setPage(1)}>1</button>
                      {page > 4 && <span className="adm-pagination-ellipsis">…</span>}
                    </>
                  )}

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

                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && <span className="adm-pagination-ellipsis">…</span>}
                      <button className="adm-pagination-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>
                    </>
                  )}

                  <button
                    className="adm-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDetail()}>
          <div className="adm-modal adm-modal-lg">
            {/* Modal Header */}
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="adm-customer-avatar" style={{ width: 40, height: 40, fontSize: 18 }}>
                  {(detailCustomer?.fullName || detailCustomer?.name || 'K').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>
                    {detailCustomer?.fullName || detailCustomer?.name || 'Khách hàng'}
                  </h3>
                  <small style={{ color: '#64748b' }}>
                    ID: {detailCustomer?.id?.slice(0, 8)}...
                  </small>
                </div>
              </div>
              <button className="adm-modal-close" onClick={closeDetail}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="adm-tabs" style={{ padding: '0 20px', borderBottom: '1px solid #e2e8f0' }}>
              <button
                className={`adm-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <User size={14} style={{ marginRight: 6 }} />
                Thông tin
              </button>
              <button
                className={`adm-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart size={14} style={{ marginRight: 6 }} />
                Đơn hàng ({detailCustomer?.totalOrders ?? 0})
              </button>
              <button
                className={`adm-tab ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin size={14} style={{ marginRight: 6 }} />
                Địa chỉ ({detailCustomer?.addresses?.length ?? 0})
              </button>
            </div>

            {/* Modal Content */}
            <div className="adm-modal-body" style={{ padding: 20, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              {detailLoading ? (
                <div className="adm-loading-spinner" style={{ padding: 40 }} />
              ) : detailCustomer ? (
                <>
                  {/* Info Tab */}
                  {activeTab === 'info' && (
                    <div>
                      {/* Stats Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                        <div className="adm-info-card">
                          <div className="adm-info-card-icon" style={{ background: '#dbeafe' }}>
                            <Package size={18} color="#3b82f6" />
                          </div>
                          <div>
                            <small>Tổng đơn hàng</small>
                            <b style={{ fontSize: 20, color: '#1e40af' }}>
                              {detailCustomer.totalOrders}
                            </b>
                          </div>
                        </div>
                        <div className="adm-info-card">
                          <div className="adm-info-card-icon" style={{ background: '#d1fae5' }}>
                            <DollarSign size={18} color="#10b981" />
                          </div>
                          <div>
                            <small>Tổng chi tiêu</small>
                            <b style={{ fontSize: 20, color: '#059669' }}>
                              {formatCurrency(detailCustomer.totalSpent)}
                            </b>
                          </div>
                        </div>
                        <div className="adm-info-card">
                          <div className="adm-info-card-icon" style={{
                            background: detailCustomer.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2'
                          }}>
                            {detailCustomer.status === 'ACTIVE'
                              ? <Check size={18} color="#10b981" />
                              : <Lock size={18} color="#ef4444" />
                            }
                          </div>
                          <div>
                            <small>Trạng thái</small>
                            <b style={{ fontSize: 16, color: detailCustomer.status === 'ACTIVE' ? '#059669' : '#dc2626' }}>
                              {detailCustomer.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                            </b>
                          </div>
                        </div>
                      </div>

                      {/* Info Fields */}
                      <div className="adm-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Họ tên</label>
                          <div className="adm-form-value">
                            {detailCustomer.fullName || detailCustomer.name || '—'}
                          </div>
                        </div>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Số điện thoại</label>
                          <div className="adm-form-value">
                            {detailCustomer.phone ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Phone size={14} style={{ color: '#64748b' }} />
                                {detailCustomer.phone}
                              </span>
                            ) : '—'}
                          </div>
                        </div>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Email</label>
                          <div className="adm-form-value">
                            {detailCustomer.email ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mail size={14} style={{ color: '#64748b' }} />
                                {detailCustomer.email}
                              </span>
                            ) : '—'}
                          </div>
                        </div>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Vai trò</label>
                          <div className="adm-form-value">
                            <span className="adm-badge" style={{
                              color: detailCustomer.role === 'ADMIN' ? '#7c3aed' : '#0891b2',
                              background: detailCustomer.role === 'ADMIN' ? '#ede9fe' : '#cffafe',
                            }}>
                              {detailCustomer.role === 'ADMIN' ? 'Quản trị' : 'Khách hàng'}
                            </span>
                          </div>
                        </div>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Ngày tham gia</label>
                          <div className="adm-form-value">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Calendar size={14} style={{ color: '#64748b' }} />
                              {formatDate(detailCustomer.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="adm-form-group">
                          <label className="adm-form-label">Cập nhật lần cuối</label>
                          <div className="adm-form-value">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} style={{ color: '#64748b' }} />
                              {formatDate(detailCustomer.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                        <button
                          className="adm-btn-primary"
                          style={{
                            background: detailCustomer.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                          }}
                          onClick={() => handleToggleStatus(detailCustomer as any)}
                        >
                          {detailCustomer.status === 'ACTIVE' ? (
                            <><Lock size={14} style={{ marginRight: 6 }} />Khóa tài khoản</>
                          ) : (
                            <><Unlock size={14} style={{ marginRight: 6 }} />Mở khóa tài khoản</>
                          )}
                        </button>
                        <Link
                          href={`/admin/orders?customerId=${detailCustomer.id}`}
                          className="adm-btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <ShoppingCart size={14} />
                          Xem tất cả đơn hàng
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <div>
                      {detailCustomer.orders && detailCustomer.orders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {detailCustomer.orders.map(order => {
                            const orderStatus = ORDER_STATUS_COLORS[order.orderStatus] || {
                              color: '#64748b', bg: '#f1f5f9', label: order.orderStatus
                            };
                            const paymentStatus = PAYMENT_STATUS_COLORS[order.paymentStatus] || {
                              color: '#64748b', bg: '#f1f5f9', label: order.paymentStatus
                            };

                            return (
                              <div key={order.id} className="adm-order-card">
                                <div className="adm-order-card-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="adm-order-code">{order.orderCode}</span>
                                    <span
                                      className="adm-badge"
                                      style={{ color: orderStatus.color, background: orderStatus.bg }}
                                    >
                                      {orderStatus.label}
                                    </span>
                                    <span
                                      className="adm-badge"
                                      style={{ color: paymentStatus.color, background: paymentStatus.bg }}
                                    >
                                      {paymentStatus.label}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="adm-order-date">
                                      <Clock size={12} />
                                      {formatShortDate(order.createdAt)}
                                    </span>
                                    <span className="adm-order-total">
                                      {formatCurrency(order.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                                <div className="adm-order-card-items">
                                  {order.orderItems.slice(0, 3).map(item => (
                                    <div key={item.id} className="adm-order-item-mini">
                                      <span>{item.productName}</span>
                                      <span style={{ color: '#64748b' }}>x{item.quantity}</span>
                                    </div>
                                  ))}
                                  {order.orderItems.length > 3 && (
                                    <div style={{ color: '#64748b', fontSize: 12 }}>
                                      +{order.orderItems.length - 3} sản phẩm khác
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="adm-empty" style={{ padding: 40 }}>
                          <div className="adm-empty-icon"><ShoppingCart size={32} /></div>
                          <p className="adm-empty-title">Chưa có đơn hàng nào</p>
                          <p className="adm-empty-desc">Khách hàng này chưa thực hiện đơn hàng nào</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Addresses Tab */}
                  {activeTab === 'addresses' && (
                    <div>
                      {detailCustomer.addresses && detailCustomer.addresses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {detailCustomer.addresses.map(addr => (
                            <div key={addr.id} className="adm-address-card">
                              {addr.isDefault && (
                                <span className="adm-badge adm-badge-primary" style={{ marginBottom: 8 }}>
                                  Mặc định
                                </span>
                              )}
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>{addr.recipientName}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                                <Phone size={12} />
                                {addr.phone}
                              </div>
                              <div style={{ color: '#475569', fontSize: 13 }}>
                                {addr.address}
                                {addr.ward ? `, ${addr.ward}` : ''}
                                {addr.district ? `, ${addr.district}` : ''}
                                {addr.city ? `, ${addr.city}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="adm-empty" style={{ padding: 40 }}>
                          <div className="adm-empty-icon"><MapPin size={32} /></div>
                          <p className="adm-empty-title">Chưa có địa chỉ nào</p>
                          <p className="adm-empty-desc">Khách hàng này chưa thêm địa chỉ giao hàng</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
