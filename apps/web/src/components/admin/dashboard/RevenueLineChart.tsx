'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueLineChartProps {
  data?: RevenueData[] | null;
}

const PERIODS = [
  { label: '7 ngày qua', value: 7 },
  { label: '14 ngày qua', value: 14 },
  { label: '30 ngày qua', value: 30 },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export default function RevenueLineChart({ data }: RevenueLineChartProps) {
  const [period, setPeriod] = useState(7);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const chartData = data && data.length > 0 ? data : null;
  const selectedPeriod = PERIODS.find(p => p.value === period) || PERIODS[0];

  if (!chartData) {
    return (
      <div className="rev-chart-wrap">
        <div className="rev-chart-header">
          <div>
            <h2 className="rev-chart-title">Doanh thu</h2>
            <p className="rev-chart-subtitle">Biến động doanh thu trong 7 ngày gần nhất</p>
          </div>
        </div>
        <div className="rev-chart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p>Chưa có dữ liệu doanh thu</p>
        </div>
      </div>
    );
  }

  // Chart dimensions
  const width = 560;
  const height = 240;
  const paddingTop = 16;
  const paddingBottom = 28;
  const paddingLeft = 56;
  const paddingRight = 16;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    value: maxRevenue * ratio,
    y: paddingTop + chartHeight * (1 - ratio),
  }));

  const xLabels = chartData.map((d, i) => ({
    label: d.date,
    x: paddingLeft + (chartWidth / Math.max(chartData.length - 1, 1)) * i,
  }));

  const points = chartData.map((d, i) => ({
    x: paddingLeft + (chartWidth / Math.max(chartData.length - 1, 1)) * i,
    y: paddingTop + chartHeight * (1 - d.revenue / maxRevenue),
  }));

  const linePath = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  const areaPath = [
    `M ${points[0].x} ${paddingTop + chartHeight}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${paddingTop + chartHeight}`,
    'Z',
  ].join(' ');

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="rev-chart-wrap">
      {/* Header */}
      <div className="rev-chart-header">
        <div>
          <h2 className="rev-chart-title">Doanh thu</h2>
          <p className="rev-chart-subtitle">Biến động doanh thu trong 7 ngày gần nhất</p>
        </div>
        <div className="rev-chart-meta">
          <div className="rev-total">
            <span className="rev-total-label">Tổng cộng</span>
            <span className="rev-total-value">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="rev-period-wrap">
            <button
              className="rev-period-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedPeriod.label}
              <ChevronDown size={13} />
            </button>
            {dropdownOpen && (
              <div className="rev-period-dropdown">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    className={`rev-period-option${period === p.value ? ' active' : ''}`}
                    onClick={() => { setPeriod(p.value); setDropdownOpen(false); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rev-chart-body">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rev-svg"
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="revGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Grid */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}

          {/* Y labels */}
          {yTicks.map((tick, i) => (
            <text
              key={i}
              x={paddingLeft - 8}
              y={tick.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="#94a3b8"
              fontFamily="inherit"
            >
              {formatCurrency(tick.value)}
            </text>
          ))}

          {/* X labels */}
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
              fontFamily="inherit"
            >
              {label.label}
            </text>
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#revGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0891b2"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#0891b2" strokeWidth={2} />
              <circle cx={p.x} cy={p.y} r={2} fill="#0891b2" />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="rev-chart-legend">
        <div className="rev-legend-item">
          <div className="rev-legend-dot" style={{ background: '#0891b2' }} />
          <span>Doanh thu (VND)</span>
        </div>
      </div>
    </div>
  );
}
