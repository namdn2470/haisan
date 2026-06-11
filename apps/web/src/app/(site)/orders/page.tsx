'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
} from 'lucide-react';
import { money } from '@/lib/money';
import { getOrders } from '@/services';


type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới đặt', color: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
  PREPARING: { label: 'Đang chuẩn bị', color: '#8b5cf6' },
  DELIVERING: { label: 'Đang giao', color: '#06b6d4' },
  COMPLETED: { label: 'Hoàn tất', color: '#10b981' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
  RETURNED: { label: 'Trả hàng', color: '#f97316' },
};

const PAYMENT_MAP: Record<string, string> = {
  COD: 'COD',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  ZALO_PAY: 'ZaloPay',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(data => setOrders(data as Order[]))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      
        <main className="hs-container hs-page-main">
          <div className="oh-loading">
            <div className="oh-skeleton-list">
              {[...Array(3)].map((_, i) => <div key={i} className="oh-skeleton-card" />)}
            </div>
          </div>
        </main>
      
    );
  }

  return (
    
      <main className="hs-container hs-page-main">
        <section className="hs-page-toolbar">
          <div>
            <h1>Đơn hàng của tôi</h1>
            <p>Theo dõi trạng thái và lịch sử đơn hải sản đã đặt</p>
          </div>
          <Link href="/products" className="hs-btn-primary">Mua sắm</Link>
        </section>
        {orders.length === 0 ? (
          <div className="oh-empty">
            <Package size={56} strokeWidth={1} color="#c0c8d4" />
            <h3>Chưa có đơn hàng nào</h3>
            <p>Hãy khám phá hải sản tươi sống và đặt hàng ngay!</p>
            <Link href="/products" className="oh-cta">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="oh-list">
            {orders.map(order => {
              const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#666' };
              return (
                <Link href={`/orders/${order.id}`} className="oh-card" key={order.id}>
                  <div className="oh-card-header">
                    <div className="oh-card-left">
                      <span className="oh-card-code">#{order.orderCode}</span>
                      <span className="oh-card-date">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="oh-card-status" style={{ background: st.color + '15', color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="oh-card-items">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="oh-card-item-name">{item.productName} x{item.quantity}</span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="oh-card-item-more">+{order.items.length - 3} sản phẩm khác</span>
                    )}
                  </div>
                  <div className="oh-card-footer">
                    <div className="oh-card-meta">
                      {order.paymentMethod && (
                        <span className="oh-card-pay">{PAYMENT_MAP[order.paymentMethod] || order.paymentMethod}</span>
                      )}
                    </div>
                    <div className="oh-card-total">
                      <span>Tổng cộng:</span>
                      <b>{money(Number(order.totalAmount))}</b>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    
  );
}
