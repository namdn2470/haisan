'use client';

import type { Order } from '@/services/orderService';

const STATUS_COLORS = {
  NEW: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PREPARING: '#8b5cf6',
  DELIVERING: '#06b6d4',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  RETURNED: '#f97316',
};

const STATUS_LABELS = {
  NEW: 'Mới đặt',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Chuẩn bị',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

interface Props {
  orders: Order[];
}

export default function OrderStatusChart({ orders }: Props) {
  const counts = Object.keys(STATUS_LABELS).map(status => ({
    status,
    label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    count: orders.filter(o => o.orderStatus === status).length,
  })).filter(s => s.count > 0);

  const total = counts.reduce((s, c) => s + c.count, 0) || 1;

  const size = 160;
  const strokeWidth = 22;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="hs-order-chart">
      <div className="hs-donut-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {counts.map((s) => {
            const pct = s.count / total;
            const dash = circumference * pct;
            const gap = circumference - dash;
            const rotation = (offset / circumference) * 360 - 90;
            offset += dash;
            return (
              <circle
                key={s.status}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                transform={`rotate(${rotation} ${cx} ${cy})`}
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94a3b8">
            đơn hàng
          </text>
        </svg>
      </div>
      <div className="hs-donut-legend">
        {counts.map(s => (
          <div className="hs-donut-legend-item" key={s.status}>
            <span className="hs-donut-legend-dot" style={{ background: s.color }} />
            <span className="hs-donut-legend-label">{s.label}</span>
            <span className="hs-donut-legend-count">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
