'use client';

import Link from 'next/link';

interface NewOrder {
  id: string;
  orderCode: string;
  date: string;
  customerName: string;
  amount: string;
  status: string;
}

interface NewOrdersCardProps {
  orders?: NewOrder[] | null;
}

export default function NewOrdersCard({ orders }: NewOrdersCardProps) {
  const items = orders && orders.length > 0 ? orders : null;

  return (
    <div className="adm-card adm-new-orders-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Đơn hàng mới
        </h3>
        <Link
          href="/admin/orders"
          style={{
            fontSize: 12,
            color: '#0891b2',
            textDecoration: 'none',
          }}
        >
          Xem tất cả
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!items ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '24px 0' }}>
            Không có đơn hàng mới
          </p>
        ) : items.map((order) => (
          <div key={order.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: 8,
            gap: 8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  {order.orderCode}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: '#ecfeff',
                  color: '#0891b2',
                }}>
                  {order.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {order.customerName} · {order.date}
              </div>
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#059669',
              whiteSpace: 'nowrap',
            }}>
              {order.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
