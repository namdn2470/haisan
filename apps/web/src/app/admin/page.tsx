'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Package, Users, Percent, Truck, Warehouse,
  BarChart3, Settings, Bell, LogOut, ShoppingCart, Clock, CheckCircle2, CreditCard,
  Eye, MoreHorizontal,
} from 'lucide-react';
import { api, img } from '@/lib/api';
import { money } from '@/lib/money';

type DashboardStats = {
  today_orders: number; today_revenue: number; week_revenue: number;
  new_orders: number; delivering_orders: number; completed_orders: number; processing_orders: number;
};

type Order = {
  id: string; orderCode: string; customerName: string; totalAmount: number;
  orderStatus: string; createdAt: string; items: { productName: string; quantity: number }[];
};

type Notification = {
  id: string; title: string; message: string; isRead: boolean; createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới đặt', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
  PREPARING: { label: 'Chuẩn bị', color: '#8b5cf6' },
  DELIVERING: { label: 'Đang giao', color: '#06b6d4' },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/account'); return; }
    api<{ data: { role?: string } }>('/api/users/me').then(r => {
      if (r.data?.role !== 'ADMIN') { router.replace('/'); return; }
      setAuthorized(true);
      api<{ data: DashboardStats }>('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
      api<{ data: Order[] }>('/api/orders').then(r => setOrders(r.data)).catch(() => {});
      api<{ data: Notification[] }>('/api/notifications').then(r => setNotifications(r.data)).catch(() => {});
    }).catch(() => router.replace('/account'));
  }, [router]);

  if (!authorized) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Đang kiểm tra quyền truy cập...</div>;

  const menus = [
    [LayoutDashboard, 'Tổng quan'], [ClipboardList, 'Đơn hàng', orders.filter(o => o.orderStatus === 'NEW').length], [Package, 'Sản phẩm'],
    [Users, 'Khách hàng'], [Percent, 'Khuyến mãi'], [Truck, 'Giao hàng'],
    [Warehouse, 'Kho hàng'], [BarChart3, 'Báo cáo'], [Settings, 'Cài đặt'],
  ] as const;

  return (
    <main className="admin-page">
      <aside className="sidebar">
        <div className="side-logo"><img src={img('logo.jpg')} /></div>
        {menus.map(([Icon, text, badge], i) => (
          <button className={i === 0 ? 'active' : ''} key={text}>
            <Icon size={19} /><span>{text}</span>{badge && badge > 0 ? <i>{badge}</i> : null}
          </button>
        ))}
        <Link href="/" className="logout"><LogOut size={19} /> Về website</Link>
      </aside>
      <section className="admin-main">
        <header className="admin-head">
          <h1>Tổng quan</h1>
          <Link href="/">Xem website</Link>
          <Bell size={22} />
        </header>

        <div className="stats">
          <Stat icon={<ShoppingCart />} label="Đơn mới" value={String(stats?.new_orders ?? '—')} sub="Cần xử lý" />
          <Stat icon={<Clock />} label="Đang chuẩn bị" value={String(stats?.processing_orders ?? '—')} sub="Đơn hàng" />
          <Stat icon={<Truck />} label="Đang giao" value={String(stats?.delivering_orders ?? '—')} sub="Đơn hàng" />
          <Stat icon={<CheckCircle2 />} label="Hoàn tất" value={String(stats?.completed_orders ?? '—')} sub="Tổng" />
          <Stat icon={<CreditCard />} label="Doanh thu" value={money(stats?.today_revenue ?? 0)} sub="Hôm nay" />
        </div>

        <div className="admin-grid">
          <div className="card"><h2>Đơn hàng mới</h2>
            <OrderTable orders={orders} />
          </div>
          <div className="card"><h2>Đơn theo trạng thái</h2>
            <div className="donut">
              <b>{orders.length}</b>
              <small>Tổng đơn</small>
            </div>
            <p className="legend">
              <i style={{ background: '#f59e0b' }} /> Mới đặt
              <i style={{ background: '#06b6d4' }} /> Đang giao
              <i style={{ background: '#10b981' }} /> Hoàn tất
            </p>
          </div>
          <div className="card"><h2>Thông báo</h2>
            {notifications.length === 0 ? (
              <p className="notice">Chưa có thông báo mới</p>
            ) : (
              notifications.slice(0, 5).map(n => (
                <p className="notice" key={n.id}>
                  {n.title}
                  <small>{new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                </p>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="stat">
      <i>{icon}</i>
      <div><span>{label}</span><b>{value}</b><small>{sub}</small></div>
    </div>
  );
}

function OrderTable({ orders }: { orders: Order[] }) {
  const recentOrders = orders.slice(0, 5);
  return (
    <table>
      <thead>
        <tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr>
      </thead>
      <tbody>
        {recentOrders.length === 0 ? (
          <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Chưa có đơn hàng</td></tr>
        ) : (
          recentOrders.map(order => {
            const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#666' };
            return (
              <tr key={order.id}>
                <td className="blue">#{order.orderCode}</td>
                <td>{order.customerName}</td>
                <td>{money(Number(order.totalAmount))}</td>
                <td><span className="status" style={{ color: st.color }}>{st.label}</span></td>
                <td><Eye size={18} /><MoreHorizontal size={18} /></td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
