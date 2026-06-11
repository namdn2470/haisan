'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, BarChart3,
  Package, Users, AlertTriangle, ArrowLeft,
  Calendar, ChevronDown, Download, RefreshCw,
} from 'lucide-react';
import { useToast } from '../layout-client';
import {
  fetchReportSummary,
  fetchReportRevenue,
  fetchReportOrders,
  fetchReportProducts,
  fetchReportCustomers,
  fetchReportInventory,
} from '@/lib/admin/api';

// ——— Types ———
type TimeRange = 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'custom';

interface SummaryData {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  cancellationRate: number;
  newCustomers: number;
  ordersByStatus: { status: string; count: number }[];
}

interface RevenueData {
  dailyRevenue: { date: string; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  totalRevenue: number;
  averageDaily: number;
  maxDaily: number;
  orderCount: number;
}

interface OrdersData {
  totalOrders: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByPayment: { method: string; count: number }[];
  ordersBySource: { source: string; count: number }[];
  dailyOrders: { date: string; total: number; completed: number; cancelled: number }[];
}

interface ProductData {
  topProducts: { productId: string; name: string; sold: number; revenue: number }[];
  totalProductsSold: number;
  totalRevenue: number;
}

interface CustomerData {
  topCustomers: { userId: string; name: string; phone: string; orderCount: number; totalSpent: number }[];
  newCustomers: { id: string; name: string; phone: string; email: string; registeredAt: string }[];
  totalNewCustomers: number;
}

interface InventoryData {
  lowStockItems: { id: string; productName: string; variantName: string | null; sku: string | null; quantity: number; threshold: number; status: string }[];
  outOfStockCount: number;
  lowStockCount: number;
  warningCount: number;
  totalProducts: number;
  totalQuantity: number;
}

// ——— Date Helpers ———
function getDateRange(range: TimeRange, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];

  switch (range) {
    case 'today': {
      const start = now.toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case '7days': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case '30days': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      return { startDate: start, endDate: end };
    }
    case 'custom':
      return { startDate: customStart || '', endDate: customEnd || end };
    default:
      return { startDate: '', endDate: end };
  }
}

// ——— CSV Export ———
function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ——— Currency Formatter ———
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '') + 'đ';
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

// ——— Order Status Labels ———
const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#0891b2',
  CONFIRMED: '#059669',
  PREPARING: '#d97706',
  DELIVERING: '#7c3aed',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  RETURNED: '#f59e0b',
};

// ——— SVG Charts ———
function LineChartSvg({ data }: { data: { labels: string[]; values: number[] } }) {
  const { labels, values } = data;
  if (!values.length) return <div className="text-muted-foreground text-sm">Không có dữ liệu</div>;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...values) * 1.1;
  const minVal = Math.min(...values) * 0.9;
  const range = maxVal - minVal || 1;

  const xStep = chartWidth / (labels.length - 1 || 1);

  const points = values.map((v, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - ((v - minVal) / range) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const formatY = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return v.toString();
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const val = minVal + range * ratio;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="inherit">{formatY(val)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#lineGradient)" opacity={0.15} />
      <path d={linePath} fill="none" stroke="#0891b2" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#0891b2" strokeWidth={2} />
      ))}
      {labels.map((label, i) => (
        <text key={i} x={padding.left + i * xStep} y={height - 10} textAnchor="middle" fontSize={11} fill="#64748b" fontFamily="inherit">
          {label}
        </text>
      ))}
    </svg>
  );
}

function BarChartSvg({ data }: { data: { labels: string[]; values: number[] } }) {
  const { labels, values } = data;
  if (!values.length) return <div className="text-muted-foreground text-sm">Không có dữ liệu</div>;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxVal = Math.max(...values) * 1.1;
  const barWidth = (chartWidth / labels.length) * 0.65;
  const gap = (chartWidth / labels.length) * 0.35;

  const formatY = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
    return `${(v / 1000).toFixed(0)}K`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const val = maxVal * ratio;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="inherit">{formatY(val)}</text>
          </g>
        );
      })}
      {values.map((val, i) => {
        const barHeight = (val / maxVal) * chartHeight;
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="url(#barGradient)" rx={4} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#0891b2" fontWeight={600} fontFamily="inherit">{formatY(val)}</text>
            <text x={x + barWidth / 2} y={height - 15} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="inherit">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChartSvg({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <div className="text-muted-foreground text-sm">Không có dữ liệu</div>;

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 70;
  const innerR = 45;

  let currentAngle = -90;
  const segments = data.map((item) => {
    const angle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(startRad);
    const y1 = cy + outerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(endRad);
    const y2 = cy + outerR * Math.sin(endRad);
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);
    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return { ...item, path: pathData };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#64748b">Tổng đơn</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: '#475569' }}>{d.label}</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.count}</span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>({((d.count / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——— Report Card ———
const REPORT_CARDS = [
  {
    id: 'summary',
    title: 'Tổng quan',
    description: 'Tổng hợp số liệu quan trọng',
    icon: BarChart3,
    iconBg: '#ecfeff',
    iconColor: '#0891b2',
  },
  {
    id: 'revenue',
    title: 'Báo cáo doanh thu',
    description: 'Thống kê doanh thu theo ngày, tháng',
    icon: TrendingUp,
    iconBg: '#f0fdf4',
    iconColor: '#059669',
  },
  {
    id: 'orders',
    title: 'Báo cáo đơn hàng',
    description: 'Phân tích đơn hàng theo trạng thái',
    icon: Package,
    iconBg: '#fefce8',
    iconColor: '#d97706',
  },
  {
    id: 'products',
    title: 'Sản phẩm bán chạy',
    description: 'Top sản phẩm có doanh số cao nhất',
    icon: Package,
    iconBg: '#faf5ff',
    iconColor: '#7c3aed',
  },
  {
    id: 'customers',
    title: 'Báo cáo khách hàng',
    description: 'Phân tích hành vi khách hàng',
    icon: Users,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
  },
  {
    id: 'inventory',
    title: 'Báo cáo tồn kho',
    description: 'Sản phẩm tồn kho thấp, hết hàng',
    icon: AlertTriangle,
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
  },
];

// ——— Detail Views ———
function EmptyState({ message = 'Chưa có dữ liệu báo cáo' }: { message?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>{message}</p>
      <p style={{ fontSize: 13, margin: 0 }}>Dữ liệu sẽ xuất hiện khi có đơn hàng trong kỳ được chọn</p>
    </div>
  );
}

function SummaryDetail({ data, loading }: { data: SummaryData | null; loading: boolean }) {
  if (loading) return <SummarySkeleton />;
  if (!data) return <EmptyState />;

  const stats = [
    { label: 'Tổng đơn hàng', value: formatNumber(data.totalOrders), color: '#0891b2' },
    { label: 'Đơn hoàn thành', value: formatNumber(data.completedOrders), color: '#059669' },
    { label: 'Đơn hủy', value: formatNumber(data.cancelledOrders), color: '#ef4444' },
    { label: 'Tổng doanh thu', value: formatCurrency(data.totalRevenue), color: '#0891b2' },
    { label: 'Giá trị TB', value: formatCurrency(data.averageOrderValue), color: '#059669' },
    { label: 'Tỷ lệ hủy', value: `${data.cancellationRate.toFixed(1)}%`, color: '#d97706' },
    { label: 'Khách hàng mới', value: formatNumber(data.newCustomers), color: '#3b82f6' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Tổng quan</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Số liệu tổng hợp trong kỳ báo cáo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>
          Đơn hàng theo trạng thái
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Trạng thái</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Số đơn</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {data.ordersByStatus.map((s, i) => {
              const pct = data.totalOrders > 0 ? ((s.count / data.totalOrders) * 100).toFixed(1) : '0';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[s.status] || '#94a3b8', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>{ORDER_STATUS_LABELS[s.status] || s.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.count)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: '#f1f5f9', borderRadius: 999 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLORS[s.status] || '#0891b2', borderRadius: 999 }} />
                      </div>
                      <span style={{ color: '#64748b', fontSize: 12, minWidth: 40 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueDetail({ data, loading, dateRange, onDateRangeChange, onExport }: {
  data: RevenueData | null;
  loading: boolean;
  dateRange: TimeRange;
  onDateRangeChange: (range: TimeRange) => void;
  onExport: () => void;
}) {
  if (loading) return <RevenueSkeleton />;
  if (!data) return <EmptyState />;

  const last7Days = data.dailyRevenue.slice(-7);
  const chartLabels = last7Days.map((d) => {
    const date = new Date(d.date);
    return `T${date.getDay() === 0 ? 'CN' : date.getDay()}`;
  });
  const chartValues = last7Days.map((d) => d.amount);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Báo cáo doanh thu</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Thống kê doanh thu theo ngày và tháng</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TimeRangeSelector value={dateRange} onChange={onDateRangeChange} />
          <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(data.totalRevenue), color: '#0891b2' },
          { label: 'Trung bình/ngày', value: formatCurrency(data.averageDaily), color: '#059669' },
          { label: 'Ngày cao nhất', value: formatCurrency(data.maxDaily), color: '#d97706' },
          { label: 'Số đơn', value: formatNumber(data.orderCount), color: '#7c3aed' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 16px' }}>Doanh thu 7 ngày gần nhất</h4>
        <LineChartSvg data={{ labels: chartLabels, values: chartValues }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>Chi tiết doanh thu theo ngày</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Ngày</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Doanh thu</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>% Tổng</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyRevenue.map((day, i) => {
              const pct = data.totalRevenue > 0 ? ((day.amount / data.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>{day.date}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(day.amount)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersDetail({ data, loading, dateRange, onDateRangeChange }: {
  data: OrdersData | null;
  loading: boolean;
  dateRange: TimeRange;
  onDateRangeChange: (range: TimeRange) => void;
}) {
  if (loading) return <OrdersSkeleton />;
  if (!data) return <EmptyState />;

  const chartData = data.ordersByStatus.map((s) => ({
    label: ORDER_STATUS_LABELS[s.status] || s.status,
    count: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Báo cáo đơn hàng</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Phân tích đơn hàng theo trạng thái và nguồn</p>
        </div>
        <TimeRangeSelector value={dateRange} onChange={onDateRangeChange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng đơn hàng', value: formatNumber(data.totalOrders), color: '#0891b2' },
          { label: 'Đơn hoàn thành', value: formatNumber(data.ordersByStatus.find(s => s.status === 'COMPLETED')?.count || 0), color: '#059669' },
          { label: 'Đơn hủy', value: formatNumber(data.ordersByStatus.find(s => s.status === 'CANCELLED')?.count || 0), color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
        <DonutChartSvg data={chartData} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>Theo phương thức</div>
          <div style={{ padding: 12 }}>
            {data.ordersByPayment.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#334155' }}>{p.method}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(p.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>Theo nguồn đơn</div>
          <div style={{ padding: 12 }}>
            {data.ordersBySource.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#334155' }}>{s.source}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsDetail({ data, loading }: { data: ProductData | null; loading: boolean }) {
  if (loading) return <ProductsSkeleton />;
  if (!data) return <EmptyState />;

  const last6Months = data.topProducts.slice(-6);
  const chartLabels = last6Months.map((p) => p.name.slice(0, 12));
  const chartValues = last6Months.map((p) => p.revenue);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Sản phẩm bán chạy</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Top sản phẩm có doanh số cao nhất</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng sản phẩm bán', value: formatNumber(data.totalProductsSold), color: '#0891b2' },
          { label: 'Tổng doanh thu', value: formatCurrency(data.totalRevenue), color: '#059669' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {chartValues.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
          <BarChartSvg data={{ labels: chartLabels, values: chartValues }} />
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Top</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Sản phẩm</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Đã bán</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Doanh thu</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>% Tổng</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((product, i) => {
              const pct = data.totalRevenue > 0 ? ((product.revenue / data.totalRevenue) * 100).toFixed(1) : '0';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2f' : '#f1f5f9',
                      color: i < 3 ? '#fff' : '#64748b',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12,
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{product.name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#334155' }}>{formatNumber(product.sold)} đơn vị</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(product.revenue)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersDetail({ data, loading }: { data: CustomerData | null; loading: boolean }) {
  if (loading) return <CustomersSkeleton />;
  if (!data) return <EmptyState />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Báo cáo khách hàng</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Phân tích hành vi và giá trị khách hàng</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Khách hàng mua nhiều nhất', value: data.topCustomers[0]?.name || '-', color: '#0891b2' },
          { label: 'Tổng chi tiêu', value: formatCurrency(data.topCustomers[0]?.totalSpent || 0), color: '#059669' },
          { label: 'Số đơn mua', value: formatNumber(data.topCustomers[0]?.orderCount || 0), color: '#d97706' },
          { label: 'Khách hàng mới', value: formatNumber(data.totalNewCustomers), color: '#3b82f6' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>Top khách hàng chi tiêu</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Khách hàng</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Số đơn</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Tổng chi</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatNumber(c.orderCount)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0891b2' }}>{formatCurrency(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f8fafc' }}>Khách hàng mới đăng ký</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Khách hàng</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Điện thoại</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {data.newCustomers.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{c.phone || '-'}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>{new Date(c.registeredAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
              {data.newCustomers.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Không có khách hàng mới</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventoryDetail({ data, loading }: { data: InventoryData | null; loading: boolean }) {
  if (loading) return <InventorySkeleton />;
  if (!data) return <EmptyState />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Báo cáo tồn kho</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sản phẩm có số lượng tồn kho dưới ngưỡng</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Hết hàng', value: data.outOfStockCount.toString(), color: '#dc2626' },
          { label: 'Tồn kho thấp', value: data.lowStockCount.toString(), color: '#ef4444' },
          { label: 'Cảnh báo', value: data.warningCount.toString(), color: '#d97706' },
          { label: 'Tổng sản phẩm', value: data.totalProducts.toString(), color: '#0891b2' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Sản phẩm</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>SKU</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Tồn kho</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Ngưỡng</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStockItems.map((item, i) => {
              const isOutOfStock = item.quantity === 0;
              const isCritical = item.quantity > 0 && item.quantity <= 3;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</span>
                    {item.variantName && <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>{item.variantName}</span>}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b', fontFamily: 'monospace' }}>{item.sku || '-'}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 36, padding: '2px 8px',
                      background: isOutOfStock ? '#fee2e2' : isCritical ? '#fee2e2' : '#fef3c7',
                      color: isOutOfStock ? '#dc2626' : isCritical ? '#dc2626' : '#d97706',
                      borderRadius: 999, fontWeight: 700, fontSize: 13,
                    }}>
                      {item.quantity}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b' }}>{item.threshold}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    {isOutOfStock ? (
                      <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>Hết hàng</span>
                    ) : isCritical ? (
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>Nguy cấp</span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 700, fontSize: 12 }}>Thấp</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {data.lowStockItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Tất cả sản phẩm đều có tồn kho đủ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ——— Time Range Selector ———
function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const [showCustom, setShowCustom] = useState(value === 'custom');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const options = [
    { value: 'today', label: 'Hôm nay' },
    { value: '7days', label: '7 ngày qua' },
    { value: '30days', label: '30 ngày qua' },
    { value: 'thisMonth', label: 'Tháng này' },
    { value: 'thisYear', label: 'Năm nay' },
    { value: 'custom', label: 'Tùy chọn' },
  ];

  const handleChange = (v: TimeRange) => {
    onChange(v);
    setShowCustom(v === 'custom');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Calendar size={14} style={{ color: '#94a3b8' }} />
      <select
        value={value}
        onChange={e => handleChange(e.target.value as TimeRange)}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 13,
          color: '#334155',
          background: '#fff',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {showCustom && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
          />
          <span style={{ color: '#64748b' }}>—</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
          />
        </div>
      )}
    </div>
  );
}

// ——— Loading Skeletons ———
function SummarySkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, height: 240 }} />
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 24, height: 200 }} />
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, height: 240 }} />
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', height: 70 }} />
        ))}
      </div>
    </div>
  );
}

// ——— Main Component ———
export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [loading, setLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const toast = useToast();

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [productsData, setProductsData] = useState<ProductData | null>(null);
  const [customersData, setCustomersData] = useState<CustomerData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setAccessError(null);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const dateParams = { startDate, endDate };

      const [summaryRes, revenueRes, ordersRes, productsRes, customersRes, inventoryRes] = await Promise.all([
        fetchReportSummary(dateParams).catch(() => null),
        fetchReportRevenue(dateParams).catch(() => null),
        fetchReportOrders(dateParams).catch(() => null),
        fetchReportProducts({ ...dateParams, limit: 10 }).catch(() => null),
        fetchReportCustomers({ ...dateParams, limit: 10 }).catch(() => null),
        fetchReportInventory().catch(() => null),
      ]);

      setSummaryData(summaryRes);
      setRevenueData(revenueRes);
      setOrdersData(ordersRes);
      setProductsData(productsRes);
      setCustomersData(customersRes);
      setInventoryData(inventoryRes);

      if (!summaryRes && !revenueRes && !ordersRes) {
        setAccessError('Bạn không có quyền xem báo cáo hoặc không thể kết nối đến API');
      }
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        setAccessError('Bạn không có quyền xem báo cáo');
      } else {
        toast.error('Không thể tải báo cáo');
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExportRevenue = () => {
    if (!revenueData) return;
    const headers = ['Ngày', 'Doanh thu'];
    const rows = revenueData.dailyRevenue.map(d => [d.date, d.amount.toString()]);
    downloadCsv(headers, rows, 'bao-cao-doanh-thu');
    toast.success('Đã tải file CSV');
  };

  const handleExportProducts = () => {
    if (!productsData) return;
    const headers = ['Tên sản phẩm', 'Số lượng bán', 'Doanh thu'];
    const rows = productsData.topProducts.map(p => [p.name, p.sold.toString(), p.revenue.toString()]);
    downloadCsv(headers, rows, 'san-pham-ban-chay');
    toast.success('Đã tải file CSV');
  };

  const handleExportOrders = () => {
    if (!ordersData) return;
    const headers = ['Ngày', 'Tổng đơn', 'Hoàn thành', 'Hủy'];
    const rows = ordersData.dailyOrders.map(d => [d.date, d.total.toString(), d.completed.toString(), d.cancelled.toString()]);
    downloadCsv(headers, rows, 'don-hang');
    toast.success('Đã tải file CSV');
  };

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeReport && (
            <button
              onClick={() => setActiveReport(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: '#fff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          )}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
              {activeReport
                ? REPORT_CARDS.find(r => r.id === activeReport)?.title
                : 'Báo cáo & Thống kê'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {activeReport
                ? 'Xem chi tiết báo cáo'
                : 'Xem các báo cáo tổng hợp về doanh thu, đơn hàng và khách hàng'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={loadReports}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
              color: '#334155',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Access error banner */}
      {accessError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '14px 18px',
          color: '#dc2626',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span>⚠️</span>
          <span>{accessError}</span>
        </div>
      )}

      {/* Overview: Report Cards Grid */}
      {!activeReport && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {REPORT_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
                onClick={() => setActiveReport(card.id)}
                onMouseOver={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: card.iconBg,
                    color: card.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={24} />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                </div>

                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: card.iconBg,
                    color: card.iconColor,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'all 0.15s',
                  }}
                  onClick={e => { e.stopPropagation(); setActiveReport(card.id); }}
                >
                  Xem báo cáo
                  <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Views */}
      {activeReport && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
          {activeReport === 'summary' && <SummaryDetail data={summaryData} loading={loading} />}
          {activeReport === 'revenue' && (
            <RevenueDetail
              data={revenueData}
              loading={loading}
              dateRange={timeRange}
              onDateRangeChange={setTimeRange}
              onExport={handleExportRevenue}
            />
          )}
          {activeReport === 'orders' && (
            <OrdersDetail
              data={ordersData}
              loading={loading}
              dateRange={timeRange}
              onDateRangeChange={setTimeRange}
            />
          )}
          {activeReport === 'products' && <ProductsDetail data={productsData} loading={loading} />}
          {activeReport === 'customers' && <CustomersDetail data={customersData} loading={loading} />}
          {activeReport === 'inventory' && <InventoryDetail data={inventoryData} loading={loading} />}
        </div>
      )}

      {/* Export buttons for products */}
      {activeReport === 'products' && productsData && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleExportProducts}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      )}

      {activeReport === 'orders' && ordersData && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleExportOrders}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      )}
    </div>
  );
}
