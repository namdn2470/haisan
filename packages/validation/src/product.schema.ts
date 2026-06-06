import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  slug: z.string().min(1),
  category_id: z.string().uuid().optional(),
  base_price: z.number().int().min(0, 'Giá không được âm'),
  unit: z.enum(['kg', 'con', 'combo', 'hop']),
  short_description: z.string().optional(),
  description: z.string().optional(),
  origin: z.string().optional(),
  storage_instruction: z.string().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
