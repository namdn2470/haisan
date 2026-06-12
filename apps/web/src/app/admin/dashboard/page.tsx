'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle2,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { fetchDashboardStats, fetchDashboardRevenue, fetchDashboardBestSellers, fetchOrders, fetchNotifications, updateOrderStatus } from '@/lib/admin/api';
import { useToast } from '../layout-client';
import DateRangePicker from '@/components/admin/dashboard/DateRangePicker';
import RevenueLineChart from '@/components/admin/dashboard/RevenueLineChart';
import OrderStatusDonut from '@/components/admin/dashboard/OrderStatusDonut';
import AdminNotifications from '@/components/admin/dashboard/AdminNotifications';
import NewOrdersCard from '@/components/admin/dashboard/NewOrdersCard';
import BestSellingProducts from '@/components/admin/dashboard/BestSellingProducts';
import LowStockCard from '@/components/admin/dashboard/LowStockCard';
import PendingOrdersTable from '@/components/admin/dashboard/PendingOrdersTable';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';
import type { OrderRealtimePayload, RealtimeEventPayload } from '@/lib/socket';

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

// ——— Dashboard Header ———
function DashboardHeader() {
  return (
    <div className="db-header">
      <div className="db-header-left">
        <h1 className="db-title">Dashboard</h1>
        <p className="db-subtitle">Tổng quan hoạt động cửa hàng hôm nay</p>
      </div>
      <div className="db-header-actions">
        <Link href="/" target="_blank" className="db-btn-outline">
          <ExternalLink size={15} />
          Xem website
        </Link>
        <DateRangePicker />
      </div>
    </div>
  );
}

// ——— KPI Stats Data ———
const KPI_ICONS = {
  'shopping-bag': ShoppingCart,
  'wallet': CreditCard,
  'package': CheckCircle2,
  'truck': Truck,
  'check': CheckCircle2,
};

// ——— Stat Card ———
function StatCard({ label, value, change, icon, gradient }: {
  label: string;
  value: string;
  change: string;
  icon: string;
  gradient: string;
}) {
  const IconComponent = KPI_ICONS[icon as keyof typeof KPI_ICONS] || Bell;
  const isPositive = change.includes('+');

  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        <div className={`stat-card-change ${isPositive ? 'positive' : 'neutral'}`}>{change}</div>
      </div>
      <div className="stat-card-icon" style={{ background: gradient }}>
        <IconComponent size={22} color="#fff" />
      </div>
    </div>
  );
}

// ——— Main Dashboard ———
export default function DashboardPage() {
  const { success, error: showError } = useToast();
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
        setStats(statsRes.value);
      }

      if (revenueRes.status === 'fulfilled') {
        setRevenue(Array.isArray(revenueRes.value) ? revenueRes.value : (revenueRes.value?.data || []));
      }

      if (bestRes.status === 'fulfilled') {
        setBestSellers(Array.isArray(bestRes.value) ? bestRes.value : (bestRes.value?.data || []));
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
  }, []);

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

  const handleConfirmOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'CONFIRMED');
      success('Đã xác nhận đơn hàng');
      loadDashboard();
      loadPendingOrders(pendingPage);
      loadNewOrders();
    } catch (err: any) {
      showError(err.message || 'Không thể xác nhận đơn hàng');
    }
  }, [pendingPage, loadDashboard, loadPendingOrders, loadNewOrders, success, showError]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'CANCELLED');
      success('Đã hủy đơn hàng');
      loadDashboard();
      loadPendingOrders(pendingPage);
      loadNewOrders();
    } catch (err: any) {
      showError(err.message || 'Không thể hủy đơn hàng');
    }
  }, [pendingPage, loadDashboard, loadPendingOrders, loadNewOrders, success, showError]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!loading) {
      loadPendingOrders(pendingPage);
      loadNewOrders();
    }
  }, [loading, pendingPage, loadPendingOrders, loadNewOrders]);

  const handleDashboardUpdated = useCallback((_payload: RealtimeEventPayload) => {
    loadDashboard();
    loadPendingOrders(pendingPage);
    loadNewOrders();
  }, [loadDashboard, loadPendingOrders, loadNewOrders, pendingPage]);

  const handleRealtimeNewOrder = useCallback((payload: OrderRealtimePayload) => {
    success(`Có đơn hàng mới #${payload.orderCode}`);
    loadDashboard();
    loadPendingOrders(pendingPage);
    loadNewOrders();
  }, [loadDashboard, loadPendingOrders, loadNewOrders, pendingPage, success]);

  useAdminRealtime({
    onDashboardUpdated: handleDashboardUpdated,
    onNewOrder: handleRealtimeNewOrder,
  });

  const revenueChartData = revenue.map((r) => ({
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
      <div className="db-loading">
        <div className="db-loading-spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="db-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Không thể tải dữ liệu dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboard} className="db-btn-primary">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="db-page">
      <DashboardHeader />

      {/* Stat Cards */}
      <section className="db-section">
        <div className="db-stat-grid">
          <StatCard
            label="Tổng đơn hàng"
            value={stats?.today_orders?.toString() ?? '0'}
            change="+15% so với tuần trước"
            icon="shopping-bag"
            gradient="linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)"
          />
          <StatCard
            label="Doanh thu"
            value={stats ? `${(Number(stats.today_revenue) / 1000000).toFixed(1)}M` : '0'}
            change="+18% so với tuần trước"
            icon="wallet"
            gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
          />
          <StatCard
            label="Đơn mới"
            value={stats?.new_orders?.toString() ?? '0'}
            change="Chờ xác nhận"
            icon="package"
            gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
          />
          <StatCard
            label="Đang giao"
            value={stats?.delivering_orders?.toString() ?? '0'}
            change="Đang trên đường"
            icon="truck"
            gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
          />
          <StatCard
            label="Đã giao"
            value={stats?.completed_orders?.toString() ?? '0'}
            change="Hoàn thành"
            icon="check"
            gradient="linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)"
          />
        </div>
      </section>

      {/* Charts Row */}
      <section className="db-section">
        <div className="db-charts-grid">
          <div className="db-card db-card-chart">
            <RevenueLineChart data={revenueChartData} />
          </div>
          <div className="db-card db-card-status">
            <OrderStatusDonut stats={orderStats} />
          </div>
          <div className="db-card db-card-notif">
            <AdminNotifications notifications={notificationItems} />
          </div>
        </div>
      </section>

      {/* Bottom Row */}
      <section className="db-section">
        <div className="db-bottom-grid">
          <div className="db-card db-card-orders">
            <PendingOrdersTable
              orders={pendingOrders}
              total={pendingTotal}
              page={pendingPage}
              onPageChange={setPendingPage}
              loading={pendingLoading}
              onConfirm={handleConfirmOrder}
              onCancel={handleCancelOrder}
            />
          </div>
          <div className="db-card-stack">
            <NewOrdersCard orders={newOrderItems} />
            <BestSellingProducts products={bestSellerCards} />
            <LowStockCard />
          </div>
        </div>
      </section>
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
