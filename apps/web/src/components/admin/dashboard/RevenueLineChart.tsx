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
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

export default function RevenueLineChart({ data }: RevenueLineChartProps) {
  const [period, setPeriod] = useState(7);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const chartData = data && data.length > 0 ? data : null;

  if (!chartData) {
    return (
      <div style={{ padding: '0 4px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
              Doanh thu
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 3, background: '#0891b2', borderRadius: 2 }} />
              <span style={{ fontSize: 13, color: '#64748b' }}>Doanh thu (đ)</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
          Chưa có dữ liệu doanh thu
        </p>
      </div>
    );
  }

  // Calculate chart dimensions
  const width = 600;
  const height = 220;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 60;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const minRevenue = 0;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    value: minRevenue + (maxRevenue - minRevenue) * (1 - ratio),
    y: paddingTop + chartHeight * ratio,
  }));

  // X-axis labels
  const xLabels = chartData.map((d, i) => ({
    label: d.date,
    x: paddingLeft + (chartWidth / (chartData.length - 1)) * i,
  }));

  // Calculate line path
  const points = chartData.map((d, i) => ({
    x: paddingLeft + (chartWidth / (chartData.length - 1)) * i,
    y: paddingTop + chartHeight * (1 - (d.revenue - minRevenue) / (maxRevenue - minRevenue)),
  }));

  const linePath = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  // Area path (for gradient fill)
  const areaPath = [
    `M ${points[0].x} ${paddingTop + chartHeight}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${paddingTop + chartHeight}`,
    'Z',
  ].join(' ');

  const selectedPeriod = PERIODS.find(p => p.value === period) || PERIODS[0];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            Doanh thu
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12,
              height: 3,
              background: '#0891b2',
              borderRadius: 2,
            }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>Doanh thu (đ)</span>
          </div>
        </div>

        {/* Period Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {selectedPeriod.label}
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              zIndex: 20,
              overflow: 'hidden',
              minWidth: 140,
            }}>
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setPeriod(p.value); setDropdownOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    background: period === p.value ? '#f0fdfa' : 'none',
                    border: 'none',
                    fontSize: 13,
                    color: period === p.value ? '#0891b2' : '#334155',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart SVG */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
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

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={paddingLeft - 8}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={11}
            fill="#94a3b8"
          >
            {formatCurrency(tick.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#94a3b8"
          >
            {label.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#revenueGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#0891b2"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#0891b2" strokeWidth={2} />
            <circle cx={p.x} cy={p.y} r={2} fill="#0891b2" />
          </g>
        ))}
      </svg>
    </div>
  );
}
