import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RealtimeGateway } from './realtime.gateway';
import { OrderRealtimePayload, RealtimeEventPayload } from './realtime.types';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emitToAdmins(event: string, payload: unknown) {
    this.gateway.emitToAdmins(event, payload);
  }

  emitToUser(userId: string | null | undefined, event: string, payload: unknown) {
    if (!userId) return;
    this.gateway.emitToUser(userId, event, payload);
  }

  emitToOrder(orderId: string | null | undefined, event: string, payload: unknown) {
    if (!orderId) return;
    this.gateway.emitToOrder(orderId, event, payload);
  }

  emitDashboardUpdated(data?: unknown) {
    this.emitToAdmins('dashboard:updated', this.createPayload({
      type: 'DASHBOARD_UPDATED',
      title: 'Dashboard updated',
      data,
    }));
  }

  emitOrderNew(order: OrderRealtimePayload) {
    this.emitToAdmins('order:new', order);
    this.emitDashboardUpdated({ source: 'order:new', orderId: order.id });
  }

  emitOrderUpdated(order: OrderRealtimePayload, userId?: string | null) {
    this.emitToAdmins('order:updated', order);
    this.emitToOrder(order.id, 'order:updated', order);
    this.emitToUser(userId, 'order:updated', order);
  }

  emitOrderStatusChanged(order: OrderRealtimePayload, userId?: string | null) {
    this.emitToAdmins('order:status_changed', order);
    this.emitToOrder(order.id, 'order:status_changed', order);
    this.emitToUser(userId, 'order:status_changed', order);
    this.emitDashboardUpdated({ source: 'order:status_changed', orderId: order.id });
  }

  emitNotificationNew(notification: RealtimeEventPayload, userId?: string | null) {
    if (userId) {
      this.emitToUser(userId, 'notification:new', notification);
    } else {
      this.emitToAdmins('notification:new', notification);
    }
  }

  emitInventoryLowStock(payload: {
    productId: string;
    productName: string;
    quantity: number;
    threshold: number;
    inventoryId?: string;
  }) {
    this.emitToAdmins('inventory:low_stock', payload);
    this.emitDashboardUpdated({ source: 'inventory:low_stock', productId: payload.productId });
  }

  emitReviewNew(payload: {
    id: string;
    productId: string;
    productName?: string;
    rating: number;
    customerName?: string;
    createdAt?: string;
  }) {
    this.emitToAdmins('review:new', payload);
    this.emitDashboardUpdated({ source: 'review:new', reviewId: payload.id });
  }

  createPayload<T>(input: Omit<RealtimeEventPayload<T>, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): RealtimeEventPayload<T> {
    return {
      id: input.id || randomUUID(),
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }
}
