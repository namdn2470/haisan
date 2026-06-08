'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, MoreHorizontal, Check, X } from 'lucide-react';

interface Order {
  id: string;
  orderCode?: string;
  order_code?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  totalAmount?: number;
  total_amount?: number;
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  payment_status?: string;
  orderStatus?: string;
  order_status?: string;
  createdAt?: string;
  created_at?: string;
}

interface PendingOrdersTableProps {
  orders?: Order[] | null;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'blue',
  CONFIRMED: 'green',
  PREPARING: 'yellow',
  DELIVERING: 'purple',
  COMPLETED: 'cyan',
  CANCELLED: 'gray',
  RETURNED: 'red',
};

const PAYMENT_COLORS: Record<string, string> = {
  COD: 'yellow',
  BANK_TRANSFER: 'green',
  MOMO: 'pink',
  ZALO_PAY: 'blue',
};

const PAYMENT_LABELS: Record<string, string> = {
  COD: 'COD',
  BANK_TRANSFER: 'CK ngân hàng',
  MOMO: 'MoMo',
  ZALO_PAY: 'ZaloPay',
};

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount)).replace('₫', 'đ');
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PendingOrdersTable({
  orders,
  total = 0,
  page = 1,
  onPageChange,
  loading = false,
}: PendingOrdersTableProps) {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const items = orders || [];
  const limit = 5;
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const tabs = [
    { label: 'Tất cả', count: total },
    { label: 'Đơn mới', count: Math.floor(total * 0.4) },
    { label: 'Đã xác nhận', count: Math.floor(total * 0.3) },
    { label: 'Đang chuẩn bị', count: Math.floor(total * 0.2) },
  ];

  return (
    <div className="adm-card adm-pending-orders-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Đơn hàng chờ xử lý
        </h3>
        <Link
          href="/admin/orders"
          style={{
            fontSize: 13,
            color: '#0891b2',
            textDecoration: 'none',
          }}
        >
          Xem tất cả đơn hàng
        </Link>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`adm-tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label}
            <span className="adm-tab-badge">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="adm-loading-spinner" />
        ) : items.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
            </div>
            <p className="adm-empty-title">Không có đơn hàng nào</p>
            <p className="adm-empty-desc">Danh sách đơn hàng đang trống</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const orderCode = order.orderCode || order.order_code || '-';
                const customerName = order.customerName || order.customer_name || '-';
                const customerPhone = order.customerPhone || order.customer_phone || '-';
                const amount = Number(order.totalAmount || order.total_amount || 0);
                const paymentMethod = order.paymentMethod || order.payment_method || 'COD';
                const orderStatus = order.orderStatus || order.order_status || 'NEW';
                const createdAt = order.createdAt || order.created_at;

                return (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0891b2' }}>
                        {orderCode}
                      </span>
                    </td>
                    <td>{customerName}</td>
                    <td>{customerPhone}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {formatCurrency(amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge-${PAYMENT_COLORS[paymentMethod] || 'gray'}`}>
                        {PAYMENT_LABELS[paymentMethod] || paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge-${STATUS_COLORS[orderStatus] || 'gray'}`}>
                        {STATUS_LABELS[orderStatus] || orderStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>
                      {formatDate(createdAt)}
                    </td>
                    <td>
                      <div className="adm-action-menu">
                        <button
                          className="adm-action-trigger"
                          onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === order.id && (
                          <div className="adm-action-dropdown">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="adm-action-item"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </Link>
                            {orderStatus === 'NEW' && (
                              <>
                                <button className="adm-action-item">
                                  <Check size={14} />
                                  Xác nhận đơn
                                </button>
                                <button className="adm-action-item" style={{ color: '#ef4444' }}>
                                  <X size={14} />
                                  Hủy đơn
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
              onClick={() => onPageChange?.(page - 1)}
            >
              ‹
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={`adm-pagination-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => onPageChange?.(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="adm-pagination-ellipsis">...</span>}
            <button
              className="adm-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
