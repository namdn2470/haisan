'use client';

interface OrderStatusData {
  status: string;
  count: number;
}

interface OrderStatusDonutProps {
  stats?: OrderStatusData[] | null;
}

const STATUS_COLORS: Record<string, string> = {
  'Đơn mới': '#0891b2',
  'Đã xác nhận': '#059669',
  'Đang chuẩn bị': '#d97706',
  'Đang giao': '#7c3aed',
  'Đã giao': '#06b6d4',
};

export default function OrderStatusDonut({ stats }: OrderStatusDonutProps) {
  const data = stats && stats.length > 0 ? stats : null;

  if (!data) {
    return (
      <div className="donut-wrap">
        <div className="donut-header">
          <h2 className="donut-title">Đơn hàng theo trạng thái</h2>
          <p className="donut-subtitle">Phân bổ đơn hàng hiện tại</p>
        </div>
        <div className="donut-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = data.map((item) => {
    const percent = total > 0 ? item.count / total : 0;
    const dashLength = circumference * percent;
    const dashOffset = circumference * cumulativePercent;
    cumulativePercent += percent;

    return {
      ...item,
      percent,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
      color: STATUS_COLORS[item.status] || '#94a3b8',
    };
  });

  return (
    <div className="donut-wrap">
      <div className="donut-header">
        <h2 className="donut-title">Đơn hàng theo trạng thái</h2>
        <p className="donut-subtitle">Phân bổ đơn hàng hiện tại</p>
      </div>

      <div className="donut-chart-center">
        <div className="donut-svg-wrap">
          <svg viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={-seg.dashOffset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="donut-center-text">
            <div className="donut-center-value">{total}</div>
            <div className="donut-center-label">Tổng đơn</div>
          </div>
        </div>
      </div>

      <div className="donut-rows">
        {segments.map((seg, i) => (
          <div key={i} className="donut-row">
            <div className="donut-row-left">
              <div className="donut-row-dot" style={{ background: seg.color }} />
              <span className="donut-row-label">{seg.status}</span>
            </div>
            <div className="donut-row-right">
              <span className="donut-row-count">{seg.count}</span>
              <span className="donut-row-pct">
                {total > 0 ? `${(seg.percent * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
