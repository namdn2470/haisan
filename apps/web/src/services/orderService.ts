'use client';

import { api, isLoggedIn } from '@/lib/api';
import { unwrapApiList, unwrapApiData } from '@/lib/api-response';

// ============================================================
// Types
// ============================================================

export type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  variantName?: string;
  imageUrl?: string;
};

export type Order = {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  shippingAddressText?: string;
  deliverySlot?: string;
  totalAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address_text: string;
  delivery_slot?: string;
  payment_method: string;
  shipping_fee?: number;
  coupon_code?: string;
  discount_amount?: number;
  note?: string;
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    selected_unit: string;
    price_at_time: number;
    processing_service_id?: string | null;
    product_name?: string;
    image_url?: string;
  }>;
};

function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    id: raw.id || raw.orderId || raw.orderCode || `order_${Date.now()}`,
    orderCode: raw.orderCode || raw.order_code || raw.code || `DH${Date.now().toString().slice(-8)}`,
    customerName: raw.customerName || raw.customer_name || '',
    customerPhone: raw.customerPhone || raw.customer_phone,
    shippingAddressText: raw.shippingAddressText || raw.shipping_address_text,
    deliverySlot: raw.deliverySlot || raw.delivery_slot,
    totalAmount: Number(raw.totalAmount ?? raw.total_amount ?? raw.total ?? 0),
    shippingFee: Number(raw.shippingFee ?? raw.shipping_fee ?? 0),
    discountAmount: Number(raw.discountAmount ?? raw.discount_amount ?? 0),
    orderStatus: raw.orderStatus || raw.order_status || 'NEW',
    paymentStatus: raw.paymentStatus || raw.payment_status || 'PENDING',
    paymentMethod: raw.paymentMethod || raw.payment_method || 'COD',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at,
    items: items.map((item: any, index: number) => {
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? item.price_at_time ?? 0);
      const quantity = Number(item.quantity || 1);
      return {
        id: item.id || `order_item_${index}`,
        productName: item.productName || item.product_name || item.name || item.product?.name || 'Sản phẩm',
        quantity,
        unitPrice,
        lineTotal: Number(item.lineTotal ?? item.line_total ?? item.totalPrice ?? item.total_price ?? unitPrice * quantity),
        variantName: item.variantName || item.variant_name,
        imageUrl: item.imageUrl || item.image_url
          || item.product?.images?.find((i: any) => i.isThumbnail)?.imageUrl
          || item.product?.images?.[0]?.imageUrl,
      };
    }),
  };
}

// ============================================================
// Order services
// ============================================================

export async function getOrders(): Promise<Order[]> {
  if (!isLoggedIn()) return [];
  try {
    const res = await api<unknown>('/api/orders');
    const raw = unwrapApiList<Order>(res);
    const backendOrders = (raw ?? []).map(normalizeOrder);
    const seen = new Set<string>();
    return backendOrders.filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  } catch {
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!isLoggedIn()) return null;
  try {
    const res = await api<unknown>(`/api/orders/${id}`);
    const data = unwrapApiData<Order>(res);
    return data ? normalizeOrder(data) : null;
  } catch {
    return null;
  }
}

  export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
    try {
      const res = await api<unknown>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const order = normalizeOrder(unwrapApiData<Order>(res));
      saveOrderToStorage(order);
      // Overwrite with full API response including real id and orderCode
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('hsbx_last_order');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.orderId = order.id;
            parsed.orderCode = order.orderCode;
            localStorage.setItem('hsbx_last_order', JSON.stringify(parsed));
          } catch {}
        }
      }
      return order;
  } catch {
    throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại sau.');
  }
}

export async function getLastOrderFromStorage(): Promise<Order | null> {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('hsbx_last_order');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.orderCode) {
        return {
          id: parsed.orderId || parsed.orderCode,
          orderCode: parsed.orderCode,
          customerName: parsed.customerName || '',
          totalAmount: parsed.total || 0,
          orderStatus: 'NEW',
          paymentStatus: 'PENDING',
          paymentMethod: parsed.paymentMethod || 'COD',
          createdAt: new Date().toISOString(),
          items: (parsed.items || []).map((i: { name: string; quantity: number; price: number; unit: string }, idx: number) => ({
            id: `local_item_${idx}`,
            productName: i.name || '',
            quantity: i.quantity || 1,
            unitPrice: i.price || 0,
            lineTotal: (i.price || 0) * (i.quantity || 1),
          })),
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveOrderToStorage(order: Order) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    'hsbx_last_order',
    JSON.stringify({
      orderCode: order.orderCode,
      orderId: order.id,
      total: order.totalAmount,
      customerName: order.customerName,
      shippingAddressText: order.shippingAddressText || '',
      deliverySlot: order.deliverySlot || '',
      paymentMethod: order.paymentMethod,
      items: order.items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
        unit: i.variantName || 'kg',
      })),
    })
  );
}
