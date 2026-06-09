'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface LowStockItem {
  id: string;
  name: string;
  remaining: number;
  unit: string;
}

interface LowStockCardProps {
  items?: LowStockItem[] | null;
}

export default function LowStockCard({ items }: LowStockCardProps) {
  const stockItems = items && items.length > 0 ? items : null;

  return (
    <div className="db-card rsc-card">
      <div className="rsc-header">
        <div className="rsc-header-left">
          <AlertTriangle size={14} color="#d97706" />
          <h3 className="rsc-title">Sắp hết hàng</h3>
        </div>
        <Link href="/admin/inventory" className="rsc-link">Quản lý</Link>
      </div>

      <div className="rsc-list">
        {!stockItems ? (
          <div className="rsc-empty">
            <p>Không có sản phẩm nào sắp hết hàng</p>
          </div>
        ) : stockItems.map((item) => (
          <div key={item.id} className="ls-item">
            <span className="ls-name">{item.name}</span>
            <span
              className="ls-badge"
              style={{
                background: item.remaining <= 3 ? '#ef4444' : '#f97316',
              }}
            >
              Còn {item.remaining} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
