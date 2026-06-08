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
      <div className="adm-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
          Đơn hàng theo trạng thái
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
          Chưa có dữ liệu
        </p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Calculate stroke dasharray for donut segments
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = 4; // gap between segments

  let cumulativePercent = 0;
  const segments = data.map((item, _index) => {
    const percent = total > 0 ? item.count / total : 0;
    const dashLength = (circumference * percent) - gap;
    const dashOffset = circumference * cumulativePercent + gap / 2;
    cumulativePercent += percent;

    return {
      ...item,
      percent,
      dashArray: `${dashLength} ${circumference}`,
      dashOffset,
      color: STATUS_COLORS[item.status] || '#94a3b8',
    };
  });

  return (
    <div className="adm-card">
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
        Đơn hàng theo trạng thái
      </h3>

      {/* Donut Chart */}
      <div style={{
        position: 'relative',
        width: 140,
        height: 140,
        margin: '0 auto 20px',
      }}>
        <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="20"
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={-seg.dashOffset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Tổng đơn</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: seg.color,
              }} />
              <span style={{ fontSize: 13, color: '#475569' }}>{seg.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                {seg.count}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', width: 40, textAlign: 'right' }}>
                {total > 0 ? `${(seg.percent * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
