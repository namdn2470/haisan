'use client';

import { apiClient } from './api-client';
import type { ApiResponse } from './api-client';

export type Promotion = {
  code: string;
  discountType: string;
  discountValue: number | string;
  minOrderAmount?: number | string;
  maxDiscountAmount?: number | string | null;
};

export async function getPromotionByCode(code: string): Promise<Promotion | null> {
  try {
    const res = await apiClient.get<ApiResponse<Promotion>>(
      `/api/promotions/code/${encodeURIComponent(code)}`
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export function calculatePromotionDiscount(promo: Promotion, subtotal: number) {
  const type = promo.discountType;
  const value = Number(promo.discountValue || 0);
  const maxDiscount = promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : 0;
  let discount = type === 'PERCENT' || type === 'PERCENTAGE'
    ? Math.round((subtotal * value) / 100)
    : value;
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  return Math.max(0, discount);
}
