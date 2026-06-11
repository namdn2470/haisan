'use client';

import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

export type Promotion = {
  id?: string;
  code: string;
  discountType: string;
  discountValue: number | string;
  minOrderAmount?: number | string;
  maxDiscountAmount?: number | string | null;
};

export type ValidateResult = {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  finalTotal: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
};

export async function getPromotionByCode(code: string): Promise<Promotion | null> {
  try {
    const res = await apiClient.get<ApiResponse<Promotion>>(
      `/api/promotions/code/${encodeURIComponent(code)}`
    );
    // API returns { success, message, data: { data: promo } }
    // apiClient returns the full JSON, so unwrap two levels:
    //   (res as any).data → { data: promo }
    //   .data → promo
    const outer = (res as any).data ?? res;
    const raw = outer?.data ?? outer;
    if (!raw || !raw.discountType) return null;
    return raw as Promotion;
  } catch {
    return null;
  }
}

export async function validatePromotion(
  code: string,
  subtotal: number
): Promise<ValidateResult | null> {
  try {
    const res = await apiClient.post<ApiResponse<ValidateResult>>(
      '/api/promotions/validate',
      { code, subtotal }
    );
    // API returns { success, message, data: { id, code, discountAmount, ... } }
    const raw = (res as any).data ?? res;
    if (!raw || typeof raw.discountAmount === 'undefined') return null;
    return raw as ValidateResult;
  } catch {
    return null;
  }
}

export function calculatePromotionDiscount(promo: Promotion, subtotal: number) {
  const type = promo.discountType;
  const value = Number(promo.discountValue || 0);
  const maxDiscount = promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : 0;

  if (value <= 0) return 0;

  let discount = 0;

  if (type === 'PERCENT') {
    discount = Math.floor((subtotal * value) / 100);
  } else if (type === 'FIXED_AMOUNT') {
    discount = value;
  } else if (type === 'FREE_SHIPPING') {
    discount = 0;
  }

  if (maxDiscount > 0) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.max(0, Math.min(discount, subtotal));
}
