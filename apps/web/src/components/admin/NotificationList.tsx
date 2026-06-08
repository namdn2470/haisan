'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

interface Props {
  notifications: NotificationItem[];
}

export default function AdminNotificationList({ notifications }: Props) {
  const list = notifications.length > 0 ? notifications : null;

  return (
    <div className="hs-card hs-notification-card">
      <div className="hs-card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} />
          <h3>Thông báo</h3>
        </div>
        {list && <span className="hs-admin-badge-count">{list.filter(n => !n.isRead).length}</span>}
      </div>
      <div className="hs-notification-list">
        {!list ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
            Chưa có thông báo nào
          </p>
        ) : list.map(n => (
          <div className={`hs-notif-item${!n.isRead ? ' unread' : ''}`} key={n.id}>
            {!n.isRead && <span className="hs-notif-dot" />}
            <div className="hs-notif-content">
              <p className="hs-notif-title">{n.title}</p>
              <small className="hs-notif-time">{formatTime(n.createdAt)}</small>
            </div>
          </div>
        ))}
      </div>
      <Link href="/quanly/orders" className="hs-admin-card-footer-link">Xem tất cả thông báo</Link>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}
