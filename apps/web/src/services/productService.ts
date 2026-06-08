import { api } from '@/lib/api';
import { unwrapApiList, unwrapApiData } from '@/lib/api-response';

// ============================================================
// Types
// ============================================================

export type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isActive?: boolean;
  parentId?: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  position: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProductVariant = {
  id: string;
  name: string;
  sizeLabel?: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  sku: string;
  isActive?: boolean;
  minWeight?: string;
  maxWeight?: string;
};

export type ProductImage = {
  id?: string;
  imageUrl: string;
  altText?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
};

export type ProcessingOption = {
  processingService: {
    id: string;
    name: string;
    price: number;
    description?: string;
  };
};

export type Review = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { fullName?: string };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  basePrice: number;
  oldPrice?: number;
  unit: string;
  badge?: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  images?: ProductImage[];
  category?: { name: string; slug: string };
};

export type ProductDetail = Product & {
  description?: string;
  origin?: string;
  storageInstruction?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isFreshLive: boolean;
  variants?: ProductVariant[];
  processingOptions?: ProcessingOption[];
  reviews?: Review[];
};

function normalizeSort(sort?: string) {
  if (sort === 'price-asc' || sort === 'price_asc') return 'price-asc';
  if (sort === 'price-desc' || sort === 'price_desc') return 'price-desc';
  if (sort === 'newest' || sort === 'new') return 'newest';
  return 'best-selling';
}

// ============================================================
// Services
// ============================================================

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await api<unknown>(`/api/categories`);
    return unwrapApiList<Category>(res);
  } catch {
    return [];
  }
}

export async function getProducts(params?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
}): Promise<Product[]> {
  const normalizedSort = normalizeSort(params?.sort);
  try {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', normalizedSort);
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    const res = await api<unknown>(`/api/products${qs ? `?${qs}` : ''}`);
    return unwrapApiList<Product>(res);
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await api<unknown>(`/api/products/slug/${slug}`);
    return unwrapApiData<ProductDetail>(res);
  } catch {
    return null;
  }
}

export async function getBanners(position?: string): Promise<Banner[]> {
  try {
    const qs = position ? `?position=${position}` : '';
    const res = await api<unknown>(`/api/banners${qs}`);
    return unwrapApiList<Banner>(res);
  } catch {
    return [];
  }
}
