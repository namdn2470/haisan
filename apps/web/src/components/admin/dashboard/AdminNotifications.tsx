'use client';

import Link from 'next/link';
import {
  ShoppingCart,
  CreditCard,
  Truck,
  AlertTriangle,
  Star,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  message: string;
  time: string;
}

interface AdminNotificationsProps {
  notifications?: Notification[] | null;
}

const NOTIF_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  ORDER_NEW: {
    icon: <ShoppingCart size={16} />,
    color: '#0891b2',
    bg: '#ecfeff',
  },
  ORDER_PAID: {
    icon: <CreditCard size={16} />,
    color: '#059669',
    bg: '#f0fdf4',
  },
  ORDER_DELIVERED: {
    icon: <CheckCircle2 size={16} />,
    color: '#059669',
    bg: '#f0fdf4',
  },
  PRODUCT_LOW_STOCK: {
    icon: <AlertTriangle size={16} />,
    color: '#d97706',
    bg: '#fffbeb',
  },
  REVIEW: {
    icon: <Star size={16} />,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  info: {
    icon: <Bell size={16} />,
    color: '#0891b2',
    bg: '#ecfeff',
  },
  default: {
    icon: <Bell size={16} />,
    color: '#64748b',
    bg: '#f8fafc',
  },
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ORDER_NEW':
    case 'order_created':
      return ShoppingCart;
    case 'ORDER_PAID':
    case 'ORDER_DELIVERED':
    case 'order_completed':
      return CheckCircle2;
    case 'ORDER_DELIVERING':
    case 'delivery':
      return Truck;
    case 'PRODUCT_LOW_STOCK':
      return AlertTriangle;
    case 'REVIEW':
      return Star;
    default:
      return Bell;
  }
};

export default function AdminNotifications({ notifications }: AdminNotificationsProps) {
  const latestNotifications = notifications ? notifications.slice(0, 6) : [];

  return (
    <div className="adm-notif-panel h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="adm-notif-header">
        <h2 className="adm-notif-title">Thông báo</h2>
        <Link
          href="/admin/notifications"
          className="adm-notif-view-all"
        >
          Xem tất cả
        </Link>
      </div>

      {latestNotifications.length === 0 ? (
        <div className="adm-notif-empty-state">
          <Bell className="adm-notif-empty-icon" />
          <p className="adm-notif-empty-title">Chưa có thông báo</p>
          <p className="adm-notif-empty-desc">Thông báo mới sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="adm-notif-list">
          {latestNotifications.map((notif) => {
            const style = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
            const IconComponent = getNotificationIcon(notif.type);

            return (
              <Link
                key={notif.id}
                href="/admin/notifications"
                className="adm-notif-item-link"
              >
                <div
                  className="adm-notif-icon"
                  style={{ background: style.bg, color: style.color }}
                >
                  <IconComponent size={16} />
                </div>

                <div className="adm-notif-content">
                  <p className="adm-notif-message">
                    {notif.message}
                  </p>
                  <span className="adm-notif-time">
                    {notif.time}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
