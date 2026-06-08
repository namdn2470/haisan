'use client';

import { useState } from 'react';

interface RevenueChartProps {
  data: number[];
  labels: string[];
}

export default function RevenueChart({ data, labels }: RevenueChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((v - min) / range) * 80 - 5,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="hs-revenue-chart">
      <div className="hs-chart-labels">
        {labels.map((l, i) => (
          <span key={i} className="hs-chart-label">{l}</span>
        ))}
      </div>
      <div className="hs-chart-svg-wrap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="hs-chart-svg">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066ff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0066ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#chartGrad)" />
          <path d={pathD} fill="none" stroke="#0066ff" strokeWidth="1.2" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="#0066ff"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ index: i, x: p.x, y: p.y })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>
        {tooltip && (
          <div
            className="hs-chart-tooltip"
            style={{ left: `${tooltip.x}%` }}
          >
            <strong>{labels[tooltip.index]}</strong>
            <span>{data[tooltip.index]}M đ</span>
          </div>
        )}
      </div>
      <div className="hs-chart-footer">
        <span className="hs-chart-min">{min}M</span>
        <span className="hs-chart-max">{max}M</span>
      </div>
    </div>
  );
}
