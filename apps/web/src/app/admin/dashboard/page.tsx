'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardStats, fetchDashboardRevenue, fetchDashboardBestSellers, fetchOrders, fetchNotifications } from '@/lib/admin/api';
import DateRangePicker from '@/components/admin/dashboard/DateRangePicker';
import AdminKpiGrid from '@/components/admin/dashboard/AdminKpiGrid';
import RevenueLineChart from '@/components/admin/dashboard/RevenueLineChart';
import OrderStatusDonut from '@/components/admin/dashboard/OrderStatusDonut';
import AdminNotifications from '@/components/admin/dashboard/AdminNotifications';
import NewOrdersCard from '@/components/admin/dashboard/NewOrdersCard';
import BestSellingProducts from '@/components/admin/dashboard/BestSellingProducts';
import LowStockCard from '@/components/admin/dashboard/LowStockCard';
import PendingOrdersTable from '@/components/admin/dashboard/PendingOrdersTable';

interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  new_orders: number;
  delivering_orders: number;
  completed_orders: number;
  processing_orders: number;
}

interface RevenueData {
  day: string;
  order_count: string;
  revenue: string;
}

interface BestSeller {
  id: string;
  name: string;
  slug: string;
  sold_count: number;
  rating_avg: number;
  total_qty_sold: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NewOrder {
  id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  orderStatus: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [orderStats, setOrderStats] = useState<{ status: string; count: number }[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, revenueRes, bestRes, notifRes] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchDashboardRevenue(7),
        fetchDashboardBestSellers(),
        fetchNotifications({ limit: 5 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (revenueRes.status === 'fulfilled') {
        setRevenue(revenueRes.value.data || []);
      }

      if (bestRes.status === 'fulfilled') {
        setBestSellers(bestRes.value.data || []);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data || []);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingOrders = useCallback(async (page: number) => {
    setPendingLoading(true);
    try {
      const result = await fetchOrders({
        status: 'NEW',
        page,
        limit: 5,
      });
      setPendingOrders(result.data || []);
      setPendingTotal(result.total || 0);
    } catch (err) {
      console.error('Pending orders load error:', err);
    } finally {
      setPendingLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    if (!stats) {
      setOrderStats([]);
      return;
    }

    setOrderStats([
      { status: 'Đơn mới', count: stats.new_orders },
      { status: 'Đang xử lý', count: stats.processing_orders },
      { status: 'Đang giao', count: stats.delivering_orders },
      { status: 'Đã giao', count: stats.completed_orders },
    ]);
  }, [stats]);

  const loadNewOrders = useCallback(async () => {
    try {
      const result = await fetchOrders({ status: 'NEW', limit: 5 });
      setNewOrders(result.data?.map((o: any) => ({
        id: o.id,
        orderCode: o.orderCode,
        customerName: o.customerName,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        orderStatus: o.orderStatus,
      })) || []);
    } catch (err) {
      console.error('New orders load error:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!loading) {
      loadPendingOrders(pendingPage);
      loadNewOrders();
    }
  }, [loading, pendingPage, loadPendingOrders, loadNewOrders]);

  const kpiStats = stats ? [
    {
      label: 'Tổng đơn hàng',
      value: stats.today_orders.toString(),
      change: '+15% so với tuần trước',
      icon: 'shopping-bag',
      color: '#0891b2',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    },
    {
      label: 'Doanh thu',
      value: `${(Number(stats.today_revenue) / 1000000).toFixed(1)}M`,
      change: '+18% so với tuần trước',
      icon: 'wallet',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    {
      label: 'Đơn mới',
      value: stats.new_orders.toString(),
      change: 'Chờ xác nhận',
      icon: 'package',
      color: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    },
    {
      label: 'Đang giao',
      value: stats.delivering_orders.toString(),
      change: 'Đang trên đường',
      icon: 'truck',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    },
    {
      label: 'Đã giao',
      value: stats.completed_orders.toString(),
      change: 'Hoàn thành',
      icon: 'check',
      color: '#0891b2',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
    },
  ] : null;

  const revenueChartData = revenue.map((r, _i) => ({
    date: new Date(r.day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: Number(r.revenue),
    orders: Number(r.order_count),
  }));

  const bestSellerCards = bestSellers.slice(0, 4).map((p, i) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    rank: i + 1,
    sold: Number(p.total_qty_sold) || p.sold_count,
    imageUrl: '/images/products/tom.svg',
  }));

  const notificationItems = notifications.map(n => ({
    id: n.id,
    type: n.type || 'info',
    message: n.message || n.title,
    time: formatTimeAgo(n.createdAt),
  }));

  const newOrderItems = newOrders.map(o => ({
    id: o.id,
    orderCode: o.orderCode,
    date: new Date(o.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    customerName: o.customerName,
    amount: formatCurrency(o.totalAmount),
    status: 'Mới',
  }));

  if (loading) {
    return (
      <div className="adm-dashboard">
        <div className="adm-dashboard-toolbar">
          <DateRangePicker />
        </div>
        <div className="adm-kpi-grid-v2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="adm-card" style={{ height: 120 }}>
              <div className="adm-skeleton" style={{ height: 60, width: 60, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="adm-skeleton adm-skeleton-text" style={{ width: '60%' }} />
                <div className="adm-skeleton adm-skeleton-title" style={{ width: '40%' }} />
                <div className="adm-skeleton adm-skeleton-text" style={{ width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="adm-loading-spinner" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="adm-error" style={{ margin: 20 }}>
        <div className="adm-error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="adm-error-title">Không thể tải dữ liệu dashboard</h3>
        <p className="adm-error-desc">{error}</p>
        <button className="adm-error-retry" onClick={loadDashboard}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="adm-dashboard">
      {/* Toolbar */}
      <div className="adm-dashboard-toolbar">
        <DateRangePicker />
      </div>

      {/* KPI Cards */}
      <AdminKpiGrid stats={kpiStats} />

      {/* Row 2: Revenue + Status Donut + Notifications */}
      <div className="adm-dashboard-row-2">
        <div className="adm-dashboard-revenue">
          <div className="adm-card">
            <RevenueLineChart data={revenueChartData} />
          </div>
        </div>
        <div className="adm-dashboard-status">
          <OrderStatusDonut stats={orderStats} />
        </div>
        <div className="adm-dashboard-notif">
          <AdminNotifications notifications={notificationItems} />
        </div>
      </div>

      {/* Row 3: Pending Orders + Right Sidebar */}
      <div className="adm-dashboard-row-3">
        <div className="adm-dashboard-orders">
          <PendingOrdersTable
            orders={pendingOrders}
            total={pendingTotal}
            page={pendingPage}
            onPageChange={setPendingPage}
            loading={pendingLoading}
          />
        </div>
        <div className="adm-dashboard-right-sidebar">
          <NewOrdersCard orders={newOrderItems} />
          <BestSellingProducts products={bestSellerCards} />
          <LowStockCard />
        </div>
      </div>
    </div>
  );
}

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', 'đ');
}
