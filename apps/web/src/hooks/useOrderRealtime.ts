'use client';

import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import type { OrderRealtimePayload, RealtimeEventPayload } from '@/lib/socket';

export function useOrderRealtime(options: {
  enabled?: boolean;
  userId?: string | null;
  orderId?: string | null;
  onOrderUpdated?: (payload: OrderRealtimePayload) => void;
  onOrderStatusChanged?: (payload: OrderRealtimePayload) => void;
  onNotification?: (payload: RealtimeEventPayload) => void;
}) {
  useEffect(() => {
    if (options.enabled === false) return;

    const socket = connectSocket();
    const joinRooms = () => {
      if (options.userId) socket.emit('user:join', { userId: options.userId });
      if (options.orderId) socket.emit('order:join', { orderId: options.orderId });
    };

    if (socket.connected) joinRooms();
    socket.on('connect', joinRooms);
    if (options.onOrderUpdated) socket.on('order:updated', options.onOrderUpdated);
    if (options.onOrderStatusChanged) socket.on('order:status_changed', options.onOrderStatusChanged);
    if (options.onNotification) socket.on('notification:new', options.onNotification);

    return () => {
      socket.off('connect', joinRooms);
      if (options.onOrderUpdated) socket.off('order:updated', options.onOrderUpdated);
      if (options.onOrderStatusChanged) socket.off('order:status_changed', options.onOrderStatusChanged);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
    };
  }, [
    options.enabled,
    options.userId,
    options.orderId,
    options.onOrderUpdated,
    options.onOrderStatusChanged,
    options.onNotification,
  ]);
}
