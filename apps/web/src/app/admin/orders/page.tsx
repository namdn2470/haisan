'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Check, X, AlertTriangle,
  Printer, Filter, Download,
  ChevronLeft, ChevronRight, Clock, User, Package,
  CreditCard, Truck, FileText, RefreshCw,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import { fetchOrders, fetchOrderById, fetchOrderHistory, updateOrderStatus, updateOrderNote } from '@/lib/admin/api';

// Order Status types matching user requirements
type OrderStatusKey = 'PENDING' | 'NEW' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
type PaymentMethodKey = 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'ZALO_PAY';

const ORDER_STATUS: Record<OrderStatusKey, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Đơn mới', color: '#0891b2', bg: '#ecfeff', icon: '🆕' },
  NEW: { label: 'Đơn mới', color: '#0891b2', bg: '#ecfeff', icon: '🆕' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#059669', bg: '#f0fdf4', icon: '✅' },
  PREPARING: { label: 'Đang chuẩn bị', color: '#d97706', bg: '#fffbeb', icon: '🥘' },
  SHIPPING: { label: 'Đang giao', color: '#7c3aed', bg: '#faf5ff', icon: '🚚' },
  DELIVERING: { label: 'Đang giao', color: '#7c3aed', bg: '#faf5ff', icon: '🚚' },
  COMPLETED: { label: 'Hoàn thành', color: '#0891b2', bg: '#ecfeff', icon: '🎉' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: '#fef2f2', icon: '❌' },
  RETURNED: { label: 'Trả hàng', color: '#dc2626', bg: '#fef2f2', icon: '↩️' },
};

const PAYMENT_METHOD: Record<PaymentMethodKey, { label: string; color: string; bg: string }> = {
  COD: { label: 'COD', color: '#d97706', bg: '#fffbeb' },
  BANK_TRANSFER: { label: 'Chuyển khoản', color: '#059669', bg: '#f0fdf4' },
  MOMO: { label: 'MoMo', color: '#ec4899', bg: '#fdf2f8' },
  ZALO_PAY: { label: 'ZaloPay', color: '#3b82f6', bg: '#eff6ff' },
};

type PaymentStatusKey = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';

const PAYMENT_STATUS: Record<PaymentStatusKey, { label: string; color: string; bg: string }> = {
  UNPAID: { label: 'Chưa thanh toán', color: '#ef4444', bg: '#fef2f2' },
  PAID: { label: 'Đã thanh toán', color: '#059669', bg: '#f0fdf4' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#7c3aed', bg: '#faf5ff' },
  FAILED: { label: 'Thanh toán thất bại', color: '#dc2626', bg: '#fef2f2' },
};

// Status transitions for order flow
const STATUS_TRANSITIONS: Partial<Record<OrderStatusKey, OrderStatusKey[]>> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['DELIVERING', 'CANCELLED'],
  SHIPPING: ['COMPLETED'],
  DELIVERING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: [],
};

function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '') + 'đ';
}

function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse API response to handle both string and number amounts
function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  unit?: string;
  product?: { images?: Array<{ imageUrl: string; isThumbnail?: boolean }> };
}

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddressText: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  processingFee?: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  adminNote?: string;
  customerNote?: string;
  createdAt: string;
  items?: OrderItem[];
  payments?: Array<{ status: string; method: string; amount: number; paidAt?: string }>;
  deliveries?: Array<{ status: string; shipper?: { fullName: string; phone: string } }>;
  statusHistory?: Array<{ status: string; note?: string; actorName?: string; createdAt: string }>;
  user?: { fullName: string; phone: string; email: string };
  coupons?: Array<{ promotion: { code: string; name: string }; discountAmount: number }>;
}

export default function OrdersPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selected order for detail view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'history'>('info');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const limit = 10;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
      });
      setOrders(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      showError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentStatusFilter, startDate, endDate, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleViewDetail = async (orderId: string) => {
    setSelectedOrderLoading(true);
    setActiveTab('info');
    try {
      const [orderRes, history] = await Promise.all([
        fetchOrderById(orderId),
        fetchOrderHistory(orderId),
      ]);
      const order = { ...orderRes, statusHistory: history };
      setSelectedOrder(order);
      setAdminNote(order.adminNote || '');
    } catch {
      showError('Không thể tải chi tiết đơn hàng');
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: keyof typeof ORDER_STATUS) => {
    const newStatusInfo = ORDER_STATUS[newStatus] || { label: newStatus };
    const isCancel = newStatus === 'CANCELLED';

    confirm({
      title: isCancel ? 'Hủy đơn hàng' : 'Cập nhật trạng thái',
      message: isCancel
        ? 'Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
        : `Cập nhật trạng thái đơn hàng thành "${newStatusInfo.label}"?`,
      confirmText: isCancel ? 'Hủy đơn' : 'Cập nhật',
      cancelText: 'Không',
      type: isCancel ? 'danger' : 'warning',
      onConfirm: async () => {
        setUpdatingStatus(true);
        try {
          await updateOrderStatus(orderId, newStatus);
          success(`Cập nhật trạng thái thành "${newStatusInfo.label}" thành công`);
          // Refresh orders list
          loadOrders();
          // Refresh selected order
          if (selectedOrder?.id === orderId) {
            const [orderRes, history] = await Promise.all([
              fetchOrderById(orderId),
              fetchOrderHistory(orderId),
            ]);
            setSelectedOrder({ ...orderRes.data, statusHistory: history });
          }
        } catch (err: any) {
          showError(err.message || 'Không thể cập nhật trạng thái');
        } finally {
          setUpdatingStatus(false);
        }
      },
    });
  };

  const handleUpdateNote = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrderNote(selectedOrder.id, adminNote);
      success('Cập nhật ghi chú thành công');
      setSelectedOrder((prev: any) => prev ? { ...prev, adminNote } : null);
    } catch (err: any) {
      showError(err.message || 'Không thể cập nhật ghi chú');
    }
  };

  const handlePrintOrder = () => {
    if (!selectedOrder) return;
    const printContent = `
      <html>
        <head>
          <title>Hóa đơn ${selectedOrder.orderCode}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; }
            .info-box h4 { margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #059669; }
            .footer { text-align: center; margin-top: 40px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HẢI SẢN BIỂN XANH</h1>
            <h2>Hóa đơn: ${selectedOrder.orderCode}</h2>
            <p>Ngày đặt: ${formatDate(selectedOrder.createdAt)}</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h4>Thông tin khách hàng</h4>
              <p><strong>${selectedOrder.customerName}</strong></p>
              <p>📞 ${selectedOrder.customerPhone}</p>
              ${selectedOrder.customerEmail ? `<p>📧 ${selectedOrder.customerEmail}</p>` : ''}
            </div>
            <div class="info-box">
              <h4>Địa chỉ giao hàng</h4>
              <p>${selectedOrder.shippingAddressText}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>SL</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedOrder.items || []).map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.productName}${item.variantName ? ` (${item.variantName})` : ''}</td>
                  <td>${formatCurrency(parseAmount(item.price))}</td>
                  <td>x${item.quantity}</td>
                  <td>${formatCurrency(parseAmount(item.totalPrice))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Tạm tính: ${formatCurrency(parseAmount(selectedOrder.subtotal))}</p>
            <p>Phí ship: ${formatCurrency(parseAmount(selectedOrder.shippingFee))}</p>
            ${parseAmount(selectedOrder.discountAmount) > 0 ? `
              <p style="color: #059669;">Giảm giá: -${formatCurrency(parseAmount(selectedOrder.discountAmount))}</p>
            ` : ''}
            <p style="font-size: 22px; margin-top: 10px;">Tổng cộng: ${formatCurrency(parseAmount(selectedOrder.totalAmount))}</p>
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách đã đặt hàng!</p>
            <p>Hải Sản Biển Xanh - Chất lượng tạo niềm tin</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt'];
    const rows = orders.map(o => [
      o.orderCode,
      o.customerName,
      o.customerPhone,
      parseAmount(o.totalAmount),
      PAYMENT_METHOD[o.paymentMethod as keyof typeof PAYMENT_METHOD]?.label || o.paymentMethod,
      ORDER_STATUS[o.orderStatus as keyof typeof ORDER_STATUS]?.label || o.orderStatus,
      formatDate(o.createdAt),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${formatDateInput(new Date())}.csv`;
    link.click();
  };

  const hasActiveFilters = statusFilter || paymentStatusFilter || startDate || endDate;

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý đơn hàng</h2>
          <p>Tổng cộng {total} đơn hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" onClick={handleExportCSV} title="Xuất CSV">
            <Download size={16} />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="adm-toolbar" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          <div className="adm-search-wrap" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={16} className="adm-search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, SĐT..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="adm-search-input"
            />
          </div>
          <button
            className={`adm-btn-ghost ${hasActiveFilters ? 'adm-btn-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Bộ lọc
            {hasActiveFilters && <span className="adm-filter-badge" />}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="adm-filters-panel" style={{ marginBottom: 16 }}>
          <div className="adm-filters-row">
            <div className="adm-filter-group">
              <label>Trạng thái đơn</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="adm-select"
              >
                <option value="">Tất cả</option>
                {Object.entries(ORDER_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="adm-filter-group">
              <label>Thanh toán</label>
              <select
                value={paymentStatusFilter}
                onChange={e => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                className="adm-select"
              >
                <option value="">Tất cả</option>
                {Object.entries(PAYMENT_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="adm-filter-group">
              <label>Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="adm-form-input"
              />
            </div>
            <div className="adm-filter-group">
              <label>Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="adm-form-input"
              />
            </div>
            {hasActiveFilters && (
              <button
                className="adm-btn-ghost"
                onClick={() => {
                  setStatusFilter('');
                  setPaymentStatusFilter('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                style={{ alignSelf: 'flex-end' }}
              >
                <X size={14} />
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="adm-loading-spinner" style={{ padding: 60 }} />
        ) : error ? (
          <div className="adm-error">
            <div className="adm-error-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="adm-error-title">Đã xảy ra lỗi</h3>
            <p className="adm-error-desc">{error}</p>
            <button className="adm-error-retry" onClick={loadOrders}>
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <Package size={32} />
            </div>
            <p className="adm-empty-title">Không có đơn hàng nào</p>
            <p className="adm-empty-desc">
              {search || hasActiveFilters
                ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                : 'Chưa có đơn hàng nào trong hệ thống'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const st = ORDER_STATUS[order.orderStatus as keyof typeof ORDER_STATUS] || { label: order.orderStatus, color: '#64748b', bg: '#f1f5f9' };
                  const pm = PAYMENT_METHOD[order.paymentMethod as keyof typeof PAYMENT_METHOD] || { label: order.paymentMethod, color: '#64748b', bg: '#f1f5f9' };

                  return (
                    <tr key={order.id}>
                      <td>
                        <span
                          style={{ fontWeight: 700, color: '#0891b2', cursor: 'pointer' }}
                          onClick={() => handleViewDetail(order.id)}
                        >
                          {order.orderCode}
                        </span>
                      </td>
                      <td>{order.customerName}</td>
                      <td style={{ color: '#64748b' }}>{order.customerPhone}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#059669' }}>
                          {formatCurrency(parseAmount(order.totalAmount))}
                        </span>
                      </td>
                      <td>
                        <span
                          className="adm-badge"
                          style={{ color: pm.color, background: pm.bg }}
                        >
                          {pm.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className="adm-badge"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            className="adm-action-trigger"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(order.id)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="adm-pagination">
            <span className="adm-pagination-info">
              Hiển thị {startItem} - {endItem} trong {total} đơn hàng
            </span>
            <div className="adm-pagination-buttons">
              <button
                className="adm-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i;
                }
                if (pageNum > totalPages) return null;
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
              {totalPages > 5 && page < totalPages - 2 && (
                <span className="adm-pagination-ellipsis">...</span>
              )}
              <button
                className="adm-pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="adm-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="adm-modal" style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3>Chi tiết đơn hàng</h3>
                <span className="adm-badge" style={{
                  color: (ORDER_STATUS[selectedOrder.orderStatus as keyof typeof ORDER_STATUS] || {}).color || '#64748b',
                  background: (ORDER_STATUS[selectedOrder.orderStatus as keyof typeof ORDER_STATUS] || {}).bg || '#f1f5f9',
                }}>
                  {selectedOrder.orderCode}
                </span>
              </div>
              <button className="adm-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            {/* Tabs */}
            <div className="adm-tabs" style={{ padding: '0 24px', borderBottom: '1px solid #e2e8f0' }}>
              <button
                className={`adm-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <FileText size={14} />
                Thông tin
              </button>
              <button
                className={`adm-tab ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Package size={14} />
                Sản phẩm ({selectedOrder.items?.length || 0})
              </button>
              <button
                className={`adm-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <Clock size={14} />
                Lịch sử
              </button>
            </div>

            {/* Modal Body */}
            <div className="adm-modal-body" style={{ flex: 1, overflow: 'auto' }}>
              {selectedOrderLoading ? (
                <div className="adm-loading-spinner" />
              ) : (
                <>
                  {/* Info Tab */}
                  {activeTab === 'info' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Customer Info */}
                      <div className="adm-info-card">
                        <div className="adm-info-card-header">
                          <User size={16} />
                          <h4>Thông tin khách hàng</h4>
                        </div>
                        <div className="adm-info-card-body">
                          <div className="adm-info-row">
                            <span className="adm-info-label">Khách hàng</span>
                            <span className="adm-info-value">{selectedOrder.customerName}</span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">SĐT</span>
                            <span className="adm-info-value">{selectedOrder.customerPhone}</span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">Email</span>
                            <span className="adm-info-value">{selectedOrder.customerEmail || '-'}</span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">Địa chỉ</span>
                            <span className="adm-info-value">{selectedOrder.shippingAddressText}</span>
                          </div>
                          {selectedOrder.customerNote && (
                            <div className="adm-info-row">
                              <span className="adm-info-label">Ghi chú KH</span>
                              <span className="adm-info-value" style={{ color: '#d97706' }}>
                                {selectedOrder.customerNote}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Status */}
                      <div className="adm-info-card">
                        <div className="adm-info-card-header">
                          <Package size={16} />
                          <h4>Trạng thái đơn hàng</h4>
                        </div>
                        <div className="adm-info-card-body">
                          <div className="adm-info-row">
                            <span className="adm-info-label">Trạng thái</span>
                            <span
                              className="adm-badge"
                              style={{
                                color: (ORDER_STATUS[selectedOrder.orderStatus as keyof typeof ORDER_STATUS] || {}).color,
                                background: (ORDER_STATUS[selectedOrder.orderStatus as keyof typeof ORDER_STATUS] || {}).bg,
                              }}
                            >
                              {(ORDER_STATUS[selectedOrder.orderStatus as keyof typeof ORDER_STATUS] || {}).label || selectedOrder.orderStatus}
                            </span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">Ngày đặt</span>
                            <span className="adm-info-value">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                          {(STATUS_TRANSITIONS[selectedOrder.orderStatus as OrderStatusKey] || [])?.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <span className="adm-info-label" style={{ marginBottom: 8, display: 'block' }}>
                                Cập nhật trạng thái
                              </span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {(STATUS_TRANSITIONS[selectedOrder.orderStatus as OrderStatusKey] || []).map(newStatus => {
                                  const isCancel = newStatus === 'CANCELLED';
                                  return (
                                    <button
                                      key={newStatus}
                                      className="adm-btn-primary adm-btn-sm"
                                      style={{
                                        background: isCancel ? '#ef4444' : '#0891b2',
                                        fontSize: 12,
                                      }}
                                      disabled={updatingStatus}
                                      onClick={() => handleUpdateStatus(selectedOrder.id, newStatus)}
                                    >
                                      {isCancel ? <X size={12} /> : <Check size={12} />}
                                      {(ORDER_STATUS[newStatus] || {}).label || newStatus}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="adm-info-card">
                        <div className="adm-info-card-header">
                          <CreditCard size={16} />
                          <h4>Thanh toán</h4>
                        </div>
                        <div className="adm-info-card-body">
                          <div className="adm-info-row">
                            <span className="adm-info-label">Phương thức</span>
                            <span
                              className="adm-badge"
                              style={{
                                color: (PAYMENT_METHOD[selectedOrder.paymentMethod as keyof typeof PAYMENT_METHOD] || {}).color,
                                background: (PAYMENT_METHOD[selectedOrder.paymentMethod as keyof typeof PAYMENT_METHOD] || {}).bg,
                              }}
                            >
                              {(PAYMENT_METHOD[selectedOrder.paymentMethod as keyof typeof PAYMENT_METHOD] || {}).label || selectedOrder.paymentMethod}
                            </span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">Trạng thái</span>
                            <span
                              className="adm-badge"
                              style={{
                                color: (PAYMENT_STATUS[selectedOrder.paymentStatus as PaymentStatusKey] || {}).color,
                                background: (PAYMENT_STATUS[selectedOrder.paymentStatus as PaymentStatusKey] || {}).bg,
                              }}
                            >
                              {(PAYMENT_STATUS[selectedOrder.paymentStatus as PaymentStatusKey] || {}).label || selectedOrder.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="adm-info-card">
                        <div className="adm-info-card-header">
                          <Truck size={16} />
                          <h4>Giao hàng</h4>
                        </div>
                        <div className="adm-info-card-body">
                          <div className="adm-info-row">
                            <span className="adm-info-label">Shipper</span>
                            <span className="adm-info-value">
                              {selectedOrder.deliveries?.[0]?.shipper?.fullName || 'Chưa gán'}
                            </span>
                          </div>
                          <div className="adm-info-row">
                            <span className="adm-info-label">Trạng thái giao</span>
                            <span className="adm-info-value">
                              {selectedOrder.deliveries?.[0]?.status || 'Chưa có'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Note */}
                      <div className="adm-info-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="adm-info-card-header">
                          <FileText size={16} />
                          <h4>Ghi chú nội bộ</h4>
                        </div>
                        <div className="adm-info-card-body">
                          <textarea
                            className="adm-form-input adm-form-textarea"
                            placeholder="Thêm ghi chú cho đơn hàng..."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginBottom: 8 }}
                          />
                          <button
                            className="adm-btn-primary adm-btn-sm"
                            onClick={handleUpdateNote}
                            disabled={adminNote === selectedOrder.adminNote}
                          >
                            <Check size={14} />
                            Lưu ghi chú
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products Tab */}
                  {activeTab === 'products' && (
                    <div>
                      <table className="adm-table" style={{ marginBottom: 16 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}>STT</th>
                            <th>Sản phẩm</th>
                            <th style={{ textAlign: 'center' }}>SL</th>
                            <th style={{ textAlign: 'right' }}>Đơn giá</th>
                            <th style={{ textAlign: 'right' }}>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder.items || []).map((item, i) => (
                            <tr key={item.id || i}>
                              <td style={{ textAlign: 'center' }}>{i + 1}</td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                {item.variantName && (
                                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.variantName}</div>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>x{item.quantity} {item.unit || ''}</td>
                              <td style={{ textAlign: 'right', color: '#64748b' }}>
                                {formatCurrency(parseAmount(item.price))}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                {formatCurrency(parseAmount(item.totalPrice))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Order Summary */}
                      <div className="adm-order-summary">
                        <div className="adm-summary-row">
                          <span>Tạm tính</span>
                          <span>{formatCurrency(parseAmount(selectedOrder.subtotal))}</span>
                        </div>
                        {parseAmount(selectedOrder.processingFee) > 0 && (
                          <div className="adm-summary-row">
                            <span>Phí xử lý</span>
                            <span>{formatCurrency(parseAmount(selectedOrder.processingFee))}</span>
                          </div>
                        )}
                        <div className="adm-summary-row">
                          <span>Phí ship</span>
                          <span>{formatCurrency(parseAmount(selectedOrder.shippingFee))}</span>
                        </div>
                        {parseAmount(selectedOrder.discountAmount) > 0 && (
                          <div className="adm-summary-row adm-summary-discount">
                            <span>Giảm giá</span>
                            <span>-{formatCurrency(parseAmount(selectedOrder.discountAmount))}</span>
                          </div>
                        )}
                        {selectedOrder.coupons?.map((coupon: any) => (
                          <div key={coupon.promotion.code} className="adm-summary-row adm-summary-discount">
                            <span>Mã {coupon.promotion.code}</span>
                            <span>-{formatCurrency(parseAmount(coupon.discountAmount))}</span>
                          </div>
                        ))}
                        <div className="adm-summary-row adm-summary-total">
                          <span>Tổng cộng</span>
                          <span style={{ color: '#059669' }}>
                            {formatCurrency(parseAmount(selectedOrder.totalAmount))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <div className="adm-timeline">
                      {(selectedOrder.statusHistory || []).length === 0 ? (
                        <div className="adm-empty" style={{ padding: 40 }}>
                          <p className="adm-empty-desc">Chưa có lịch sử cập nhật</p>
                        </div>
                      ) : (
                        (selectedOrder.statusHistory || []).map((history, i) => (
                          <div key={history.createdAt + i} className="adm-timeline-item">
                            <div className="adm-timeline-dot" style={{
                              background: (ORDER_STATUS[history.status as keyof typeof ORDER_STATUS] || {}).color || '#64748b'
                            }} />
                            <div className="adm-timeline-content">
                              <div className="adm-timeline-header">
                                <span
                                  className="adm-badge"
                                  style={{
                                    color: (ORDER_STATUS[history.status as keyof typeof ORDER_STATUS] || {}).color,
                                    background: (ORDER_STATUS[history.status as keyof typeof ORDER_STATUS] || {}).bg,
                                  }}
                                >
                                  {(ORDER_STATUS[history.status as keyof typeof ORDER_STATUS] || {}).label || history.status}
                                </span>
                                <span className="adm-timeline-time">{formatDate(history.createdAt)}</span>
                              </div>
                              {history.note && (
                                <p className="adm-timeline-note">{history.note}</p>
                              )}
                              {history.actorName && (
                                <span className="adm-timeline-actor">
                                  bởi {history.actorName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
              <button className="adm-btn-primary" onClick={handlePrintOrder}>
                <Printer size={14} />
                In đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
