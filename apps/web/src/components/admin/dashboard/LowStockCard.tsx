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
    <div className="adm-card adm-low-stock-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#d97706" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Sắp hết hàng
          </h3>
        </div>
        <Link
          href="/admin/inventory"
          style={{
            fontSize: 12,
            color: '#0891b2',
            textDecoration: 'none',
          }}
        >
          Quản lý
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!stockItems ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
            Không có sản phẩm nào sắp hết hàng
          </p>
        ) : stockItems.map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: '#fef2f2',
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>
              {item.name}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: item.remaining <= 3 ? '#ef4444' : '#f97316',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}>
              Còn {item.remaining} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
