'use client';

import { apiClient } from './api-client';
import type { ApiResponse } from './api-client';

export async function getRemoteCart<T = unknown>() {
  return apiClient.get<ApiResponse<T>>('/api/carts');
}

export async function addRemoteCartItem<T = unknown>(payload: unknown) {
  return apiClient.post<ApiResponse<T>>('/api/carts/items', payload);
}

export async function updateRemoteCartItem<T = unknown>(itemId: string, quantity: number) {
  return apiClient.put<ApiResponse<T>>(`/api/carts/items/${itemId}`, { quantity });
}

export async function removeRemoteCartItem<T = unknown>(itemId: string) {
  return apiClient.delete<ApiResponse<T>>(`/api/carts/items/${itemId}`);
}
