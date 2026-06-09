'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Plus, Search, AlertTriangle, CheckCheck,
  ShoppingCart, CreditCard, Truck, Star,
} from 'lucide-react';
import { useToast, useConfirm } from '../layout';
import { fetchNotifications, markNotificationRead } from '@/lib/admin/api';

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  ORDER_NEW: <ShoppingCart size={14} />,
  ORDER_PAID: <CreditCard size={14} />,
  ORDER_DELIVERED: <Truck size={14} />,
  PRODUCT_LOW_STOCK: <AlertTriangle size={14} />,
  REVIEW: <Star size={14} />,
};

const NOTIF_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  ORDER_NEW: { label: 'Đơn mới', color: '#0891b2', bg: '#e0f2fe' },
  ORDER_PAID: { label: 'Đã thanh toán', color: '#059669', bg: '#d1fae5' },
  ORDER_DELIVERED: { label: 'Đã giao', color: '#10b981', bg: '#d1fae5' },
  PRODUCT_LOW_STOCK: { label: 'Hết hàng', color: '#dc2626', bg: '#fee2e2' },
  REVIEW: { label: 'Đánh giá', color: '#d97706', bg: '#fef3c7' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const limit = 15;

  const load = useCallback(async (searchVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifications({ page, limit });
      let items = result.data || [];
      if (searchVal) {
        const q = searchVal.toLowerCase();
        items = items.filter((n: any) =>
          (n.message || n.title || '').toLowerCase().includes(q)
        );
      }
      setNotifications(items);
      setTotal(result.total || items.length);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông báo');
      showError(err.message || 'Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      load(value || undefined);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      success('Đã đánh dấu đã đọc');
    } catch {
      showError('Không thể cập nhật');
    }
  };

  const handleMarkAllRead = () => {
    confirm({
      title: 'Đánh dấu tất cả đã đọc',
      message: 'Xác nhận đánh dấu tất cả thông báo là đã đọc?',
      confirmText: 'Xác nhận',
      type: 'info',
      onConfirm: async () => {
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) {
          try {
            await markNotificationRead(n.id);
          } catch { /* skip */ }
        }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        success('Đã đánh dấu tất cả đã đọc');
      },
    });
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h2>Quản lý thông báo</h2>
          <p>{total} thông báo</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="adm-btn-secondary"
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => n.isRead)}
          >
            <CheckCheck size={16} />
            Đánh dấu đã đọc
          </button>
          <button className="adm-btn-primary">
            <Plus size={16} />
            Tạo thông báo
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="adm-search-input"
          />
        </div>
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
            <button className="adm-error-retry" onClick={() => load()}>Thử lại</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon"><Bell size={32} /></div>
            <p className="adm-empty-title">Không có thông báo</p>
            <p className="adm-empty-desc">
              {search ? 'Không tìm thấy thông báo phù hợp' : 'Chưa có thông báo nào trong hệ thống'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th style={{ width: 100 }}>Loại</th>
                    <th>Nội dung</th>
                    <th style={{ width: 110 }}>Trạng thái</th>
                    <th style={{ width: 140 }}>Ngày tạo</th>
                    <th style={{ width: 100, textAlign: 'center' as const }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n: any) => {
                    const nt = NOTIF_TYPES[n.type] || {
                      label: n.type || 'Khác',
                      color: '#64748b',
                      bg: '#f1f5f9',
                    };

                    return (
                      <tr key={n.id} className={!n.isRead ? 'adm-notif-row-unread' : ''}>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: n.isRead ? 'transparent' : '#0891b2',
                            margin: '0 auto',
                          }} />
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{ color: nt.color, background: nt.bg, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {NOTIF_ICONS[n.type] || <Bell size={14} />}
                            {nt.label}
                          </span>
                        </td>
                        <td>
                          <div style={{
                            fontWeight: n.isRead ? 400 : 600,
                            color: '#0f172a',
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                          }}>
                            {n.message || n.title || '(Không có nội dung)'}
                          </div>
                        </td>
                        <td>
                          <span
                            className="adm-status-badge"
                            style={{
                              color: n.isRead ? '#64748b' : '#0891b2',
                              background: n.isRead ? '#f1f5f9' : '#e0f2fe',
                            }}
                          >
                            {n.isRead ? 'Đã đọc' : 'Chưa đọc'}
                          </span>
                        </td>
                        <td>
                          <span className="adm-date-cell">
                            {formatDate(n.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="adm-action-trigger"
                              title="Đánh dấu đã đọc"
                              onClick={() => handleMarkRead(n.id)}
                              style={{ opacity: n.isRead ? 0.3 : 1, pointerEvents: n.isRead ? 'none' as const : 'auto' as const }}
                            >
                              <CheckCheck size={15} />
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
                  Hiển thị {startItem} - {endItem} trong {total} thông báo
                </span>
                <div className="adm-pagination-buttons">
                  <button
                    className="adm-pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
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
                  {totalPages > 5 && <span className="adm-pagination-ellipsis">...</span>}
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
    </div>
  );
}
