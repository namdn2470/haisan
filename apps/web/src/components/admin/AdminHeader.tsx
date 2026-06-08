'use client';

import Link from 'next/link';
import { Bell, ExternalLink, Menu, ChevronDown, ShoppingCart, AlertTriangle, Star, CreditCard, Truck } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNotifications, markNotificationRead } from '@/lib/admin/api';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan',
  '/admin/products': 'Quản lý sản phẩm',
  '/admin/products/create': 'Thêm sản phẩm',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/orders': 'Quản lý đơn hàng',
  '/admin/customers': 'Quản lý khách hàng',
  '/admin/staff': 'Quản lý nhân viên',
  '/admin/roles': 'Vai trò & Quyền',
  '/admin/banners': 'Quản lý Banner',
  '/admin/promotions': 'Quản lý khuyến mãi',
  '/admin/posts': 'Quản lý bài viết',
  '/admin/reviews': 'Quản lý đánh giá',
  '/admin/delivery': 'Quản lý giao hàng',
  '/admin/inventory': 'Quản lý kho hàng',
  '/admin/reports': 'Báo cáo',
  '/admin/config': 'Cấu hình',
  '/admin/settings': 'Cài đặt hệ thống',
};

interface AdminHeaderProps {
  pathname: string;
  user?: { fullName?: string; phone?: string; role: string } | null;
  onToggle?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
};

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  ORDER_NEW: <ShoppingCart size={14} />,
  ORDER_PAID: <CreditCard size={14} />,
  ORDER_DELIVERED: <Truck size={14} />,
  PRODUCT_LOW_STOCK: <AlertTriangle size={14} />,
  REVIEW: <Star size={14} />,
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function AdminHeader({ pathname, user, onToggle }: AdminHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifs = useCallback(async () => {
    try {
      const data = await fetchNotifications({ limit: 10 });
      const items = data.data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n: any) => !n.isRead).length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const title = PAGE_TITLES[pathname] || 'Admin';
  const displayName = user?.fullName || user?.phone || 'Admin';
  const displayRole = ROLE_LABELS[user?.role || ''] || user?.role || 'Quản trị viên';

  return (
    <header className="adm-header">
      <div className="adm-header-left">
        <button className="adm-hamburger" onClick={onToggle} aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="adm-header-title-group">
          <h1 className="adm-title">{title}</h1>
        </div>
      </div>

      <div className="adm-header-right">
        <Link href="/" target="_blank" className="adm-header-btn adm-view-site">
          <ExternalLink size={15} />
          <span>Xem website</span>
        </Link>

        <div className="adm-notif-wrapper" ref={notifRef}>
          <button
            className="adm-header-btn adm-notif-btn"
            aria-label="Thông báo"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="adm-notif-badge">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="adm-notif-dropdown">
              <div className="adm-notif-dropdown-header">
                <span>Thông báo</span>
                <Link href="/admin/dashboard" style={{ fontSize: 12, color: '#0891b2', textDecoration: 'none' }} onClick={() => setNotifOpen(false)}>
                  Xem tất cả
                </Link>
              </div>
              <div className="adm-notif-dropdown-body">
                {notifications.length === 0 ? (
                  <p className="adm-notif-empty">Chưa có thông báo</p>
                ) : notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`adm-notif-item ${!n.isRead ? 'adm-notif-item-unread' : ''}`}
                    onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
                  >
                    <div className="adm-notif-item-icon">
                      {NOTIF_ICONS[n.type] || <Bell size={14} />}
                    </div>
                    <div className="adm-notif-item-content">
                      <p className="adm-notif-item-message">{n.message || n.title}</p>
                      <span className="adm-notif-item-time">{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="adm-user-chip" onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ cursor: 'pointer' }}>
          <div className="adm-user-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div className="adm-user-info">
            <span className="adm-user-name">{displayName}</span>
            <span className="adm-user-role">{displayRole}</span>
          </div>
          <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: 4 }} />
        </div>
      </div>
    </header>
  );
}
