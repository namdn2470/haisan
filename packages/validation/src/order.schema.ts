import { z } from 'zod';

export const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Vui lòng nhập tên người nhận'),
  customer_phone: z.string().regex(/^(0|\+84)[3-9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  customer_email: z.string().email().optional().or(z.literal('')),
  shipping_address_id: z.string().uuid().optional(),
  shipping_address_text: z.string().min(1, 'Vui lòng nhập địa chỉ giao hàng'),
  payment_method: z.enum(['cod', 'bank_transfer', 'momo', 'zalo_pay']),
  delivery_date: z.string().optional(),
  delivery_time_slot_id: z.string().uuid().optional(),
  customer_note: z.string().optional(),
  coupon_code: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled', 'returned']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
