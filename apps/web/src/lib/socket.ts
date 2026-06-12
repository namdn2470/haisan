'use client';

import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/api';

export type RealtimeEventPayload<T = unknown> = {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: T;
  createdAt: string;
};

export type OrderRealtimePayload = {
  id: string;
  orderCode: string;
  status: string;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

let socket: Socket | null = null;

function getSocketBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:3001';
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${getSocketBaseUrl()}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      auth: (cb) => {
        cb({ token: getToken() || undefined });
      },
    });
  }

  return socket;
}

export function connectSocket(): Socket {
  const activeSocket = getSocket();
  activeSocket.auth = { token: getToken() || undefined };
  if (!activeSocket.connected) activeSocket.connect();
  return activeSocket;
}
