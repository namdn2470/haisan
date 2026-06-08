'use client';

import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
}

export default function DateRangePicker({ startDate, endDate }: DateRangePickerProps) {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const start = startDate || formatDate(weekAgo);
  const end = endDate || formatDate(today);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
    }}>
      <Calendar size={16} color="#64748b" />
      <span style={{ fontSize: 14, color: '#334155' }}>
        {start} - {end}
      </span>
    </div>
  );
}
