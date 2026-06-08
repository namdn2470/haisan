'use client';

import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

export type ShippingQuote = {
  shippingFee: number;
  source: 'shipping_zone' | 'store_settings';
  zone: {
    id: string;
    name: string;
    province: string | null;
    district: string | null;
    freeFromAmount: number;
    estimatedDays: number | null;
  } | null;
};

export async function getShippingQuote(params: {
  province?: string;
  district?: string;
  subtotal: number;
}): Promise<ShippingQuote | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params.subtotal > 0) searchParams.set('subtotal', String(params.subtotal));
    if (params.province?.trim()) searchParams.set('province', params.province.trim());
    if (params.district?.trim()) searchParams.set('district', params.district.trim());

    const qs = searchParams.toString();
    const res = await api<ApiResponse<ShippingQuote>>(`/api/shipping-zones/quote${qs ? `?${qs}` : ''}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
