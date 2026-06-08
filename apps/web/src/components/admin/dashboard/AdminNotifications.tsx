'use client';

import Link from 'next/link';
import {
  ShoppingCart,
  CreditCard,
  Truck,
  AlertTriangle,
  Star,
  Bell,
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
    icon: <Truck size={16} />,
    color: '#7c3aed',
    bg: '#faf5ff',
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
  default: {
    icon: <Bell size={16} />,
    color: '#64748b',
    bg: '#f8fafc',
  },
};

export default function AdminNotifications({ notifications }: AdminNotificationsProps) {
  const items = notifications && notifications.length > 0 ? notifications : null;

  return (
    <div className="adm-card adm-notif-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Thông báo
        </h3>
        <Link
          href="/admin/notifications"
          style={{
            fontSize: 12,
            color: '#0891b2',
            textDecoration: 'none',
          }}
        >
          Xem tất cả
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!items ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
            Chưa có thông báo nào
          </p>
        ) : items.map((notif) => {
          const style = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
          return (
            <div key={notif.id} style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: style.bg,
                color: style.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {style.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13,
                  color: '#334155',
                  margin: 0,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'block' }}>
                  {notif.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
