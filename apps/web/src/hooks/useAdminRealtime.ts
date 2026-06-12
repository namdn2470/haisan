'use client';

import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import type { OrderRealtimePayload, RealtimeEventPayload } from '@/lib/socket';

type InventoryLowStockPayload = {
  productId: string;
  productName: string;
  quantity: number;
  threshold: number;
  inventoryId?: string;
};

type ReviewNewPayload = {
  id: string;
  productId: string;
  productName?: string;
  rating: number;
  customerName?: string;
  createdAt?: string;
};

export function useAdminRealtime(options: {
  enabled?: boolean;
  onNewOrder?: (payload: OrderRealtimePayload) => void;
  onOrderUpdated?: (payload: OrderRealtimePayload) => void;
  onNotification?: (payload: RealtimeEventPayload) => void;
  onDashboardUpdated?: (payload: RealtimeEventPayload) => void;
  onInventoryLowStock?: (payload: InventoryLowStockPayload) => void;
  onReviewNew?: (payload: ReviewNewPayload) => void;
}) {
  useEffect(() => {
    if (options.enabled === false) return;

    const socket = connectSocket();
    const joinAdmin = () => socket.emit('admin:join');

    if (socket.connected) joinAdmin();
    socket.on('connect', joinAdmin);
    if (options.onNewOrder) socket.on('order:new', options.onNewOrder);
    if (options.onOrderUpdated) socket.on('order:updated', options.onOrderUpdated);
    if (options.onNotification) socket.on('notification:new', options.onNotification);
    if (options.onDashboardUpdated) socket.on('dashboard:updated', options.onDashboardUpdated);
    if (options.onInventoryLowStock) socket.on('inventory:low_stock', options.onInventoryLowStock);
    if (options.onReviewNew) socket.on('review:new', options.onReviewNew);

    return () => {
      socket.off('connect', joinAdmin);
      if (options.onNewOrder) socket.off('order:new', options.onNewOrder);
      if (options.onOrderUpdated) socket.off('order:updated', options.onOrderUpdated);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
      if (options.onDashboardUpdated) socket.off('dashboard:updated', options.onDashboardUpdated);
      if (options.onInventoryLowStock) socket.off('inventory:low_stock', options.onInventoryLowStock);
      if (options.onReviewNew) socket.off('review:new', options.onReviewNew);
    };
  }, [
    options.enabled,
    options.onNewOrder,
    options.onOrderUpdated,
    options.onNotification,
    options.onDashboardUpdated,
    options.onInventoryLowStock,
    options.onReviewNew,
  ]);
}
