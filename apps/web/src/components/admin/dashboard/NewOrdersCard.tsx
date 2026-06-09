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
    <div className="db-card rsc-card">
      <div className="rsc-header">
        <h3 className="rsc-title">Đơn hàng mới</h3>
        <Link href="/admin/orders" className="rsc-link">Xem tất cả</Link>
      </div>

      <div className="rsc-list">
        {!items ? (
          <div className="rsc-empty">
            <p>Không có đơn hàng mới</p>
          </div>
        ) : items.map((order) => (
          <div key={order.id} className="rsc-item">
            <div className="rsc-item-main">
              <div className="rsc-item-top">
                <span className="rsc-order-code">{order.orderCode}</span>
                <span className="rsc-badge">{order.status}</span>
              </div>
              <div className="rsc-item-meta">
                {order.customerName} · {order.date}
              </div>
            </div>
            <div className="rsc-item-amount">{order.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
