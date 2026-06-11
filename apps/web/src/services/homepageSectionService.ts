import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

export type HomeSectionPublic = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled: boolean;
  maxItems: number;
  products: HomeProductSummary[];
};

export type HomeProductSummary = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  oldPrice?: number;
  unit: string;
  shortDescription?: string;
  badge?: string;
  images: { imageUrl: string }[];
  status: string;
};

export type HomeSectionAdmin = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled: boolean;
  sortOrder: number;
  maxItems: number;
  items: HomeSectionItemAdmin[];
};

export type HomeSectionItemAdmin = {
  id: string;
  sectionId: string;
  productId: string;
  sortOrder: number;
  product: HomeProductSummary;
};

export async function getHomepageSectionsPublic(): Promise<HomeSectionPublic[]> {
  const res = await apiClient.get<ApiResponse<HomeSectionPublic[]>>('/api/homepage-sections/public');
  return res.data ?? [];
}

export async function getHomepageSectionsAdmin(): Promise<HomeSectionAdmin[]> {
  const res = await apiClient.get<ApiResponse<HomeSectionAdmin[]>>('/api/homepage-sections');
  return res.data ?? [];
}

export async function getHomepageSectionAdmin(slug: string): Promise<HomeSectionAdmin | null> {
  const res = await apiClient.get<ApiResponse<HomeSectionAdmin>>(`/api/homepage-sections/${slug}`);
  return res.data ?? null;
}

export type UpsertSectionPayload = {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled?: boolean;
  sortOrder?: number;
  maxItems?: number;
  items?: { productId: string; sortOrder?: number }[];
};

export async function upsertHomepageSection(
  slug: string,
  payload: UpsertSectionPayload,
): Promise<HomeSectionAdmin> {
  const res = await apiClient.put<ApiResponse<HomeSectionAdmin>>(
    `/api/homepage-sections/${slug}`,
    payload,
  );
  return res.data as HomeSectionAdmin;
}
