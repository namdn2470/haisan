'use client';

import { money } from '@/lib/money';
import type { Order } from '@/services/orderService';
import StatusBadge from './StatusBadge';
import { Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới đặt', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
  PREPARING: { label: 'Chuẩn bị', color: '#8b5cf6' },
  DELIVERING: { label: 'Đang giao', color: '#06b6d4' },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
};

interface Props {
  orders: Order[];
}

export default function RecentOrders({ orders }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize) || 1);
  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  if (!orders || orders.length === 0) {
    return (
      <div className="hs-admin-empty">
        <p>Chưa có đơn hàng nào</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hs-admin-table-wrap">
        <table className="hs-admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map(order => {
              const st = ORDER_STATUS[order.orderStatus] || { label: order.orderStatus, color: '#64748b' };
              return (
                <tr key={order.id}>
                  <td>
                    <span className="hs-admin-order-id">
                      #{(order as any).orderCode || 'DH' + order.id?.slice(-4) || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="hs-admin-customer">{(order as any).customerName || 'Khách lẻ'}</span>
                    <br />
                    <small className="hs-admin-order-date">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </small>
                  </td>
                  <td>
                    <span className="hs-admin-phone">{(order as any).customerPhone || (order as any).shippingPhone || '—'}</span>
                  </td>
                  <td>
                    <span className="hs-admin-price">{money(Number((order as any).totalAmount || 0))}</span>
                  </td>
                  <td>
                    <span className={`hs-admin-payment ${(order as any).paymentStatus === 'PAID' ? 'paid' : ''}`}>
                      {(order as any).paymentStatus === 'PAID' ? 'Chuyển khoản' : 'COD'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={order.orderStatus} label={st.label} color={st.color} small />
                  </td>
                  <td>
                    <div className="hs-admin-action-btns">
                      <button className="hs-admin-action-btn" title="Xem chi tiết">
                        <Eye size={15} />
                      </button>
                      <button className="hs-admin-action-btn" title="Xem thêm">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="hs-admin-pagination">
        <button
          className="hs-admin-pagination-btn"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            className={`hs-admin-pagination-btn${p === page ? ' active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="hs-admin-pagination-btn"
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
