'use client';

import { ShoppingBag, Package, Truck, Check } from 'lucide-react';

interface KpiStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  gradient: string;
}

interface AdminKpiGridProps {
  stats?: KpiStat[] | null;
}

const FALLBACK_STATS: KpiStat[] = [
  {
    label: 'Tổng đơn hàng',
    value: '0',
    change: '+0% so với tuần trước',
    icon: 'shopping-bag',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  },
  {
    label: 'Doanh thu',
    value: '0đ',
    change: '+0% so với tuần trước',
    icon: 'wallet',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  },
  {
    label: 'Đơn mới',
    value: '0',
    change: 'Chờ xác nhận',
    icon: 'package',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  },
  {
    label: 'Đang giao',
    value: '0',
    change: 'Đang trên đường',
    icon: 'truck',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  },
  {
    label: 'Đã giao',
    value: '0',
    change: 'Hoàn thành',
    icon: 'check',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
  },
];

function KpiIcon({ icon, gradient }: { icon: string; gradient: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    'shopping-bag': <ShoppingBag size={22} color="#fff" />,
    'wallet': (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    ),
    'package': <Package size={22} color="#fff" />,
    'truck': <Truck size={22} color="#fff" />,
    'check': <Check size={22} color="#fff" />,
  };

  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {iconMap[icon] || iconMap['package']}
    </div>
  );
}

export default function AdminKpiGrid({ stats }: AdminKpiGridProps) {
  const displayStats = stats || FALLBACK_STATS;

  return (
    <div className="adm-kpi-grid-v2">
      {displayStats.map((stat, index) => (
        <div key={index} className="adm-kpi-card-v2">
          <KpiIcon icon={stat.icon} gradient={stat.gradient} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              color: '#64748b',
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 12,
              color: stat.change.includes('+') ? '#059669' : '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {stat.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
