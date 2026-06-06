export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  role: 'customer' | 'admin' | 'staff' | 'shipper';
  status: 'active' | 'blocked';
}

export interface Address {
  id: string;
  user_id: string;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  district: string;
  ward: string;
  address_line: string;
  is_default: boolean;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  origin?: string;
  storage_instruction?: string;
  unit: string;
  base_price: number;
  old_price?: number;
  status: string;
  badge?: string;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  image_url: string;
  is_thumbnail: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  size_label?: string;
  min_weight?: number;
  max_weight?: number;
  unit: string;
  price: number;
  stock_qty: number;
  sku: string;
  is_active: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  status: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  product_name?: string;
  quantity: number;
  selected_unit: string;
  price_at_time: number;
  note?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  shipping_address_text: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  unit: string;
  quantity: number;
  price: number;
  total_price: number;
}
