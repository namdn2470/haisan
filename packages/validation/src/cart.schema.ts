import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  selected_unit: z.enum(['kg', 'con', 'combo', 'hop']),
  processing_service_id: z.string().uuid().optional(),
  note: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
