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
