import { z } from 'zod';

export const createAddressSchema = z.object({
  receiver_name: z.string().min(1, 'Vui lòng nhập tên người nhận'),
  receiver_phone: z.string().regex(/^(0|\+84)[3-9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  province: z.string().min(1),
  district: z.string().min(1),
  ward: z.string().min(1),
  address_line: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  note: z.string().optional(),
  is_default: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
