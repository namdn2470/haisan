import { api } from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';

export type PublicStoreSettings = {
  id: string;
  storeName: string | null;
  storeDescription: string | null;
  logo: string | null;
  favicon: string | null;
  phone: string | null;
  hotline: string | null;
  email: string | null;
  address: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  mapUrl: string | null;
  openingHours: string | null;
  deliveryPolicy: string | null;
  returnPolicy: string | null;
  facebookUrl: string | null;
  zaloUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
};

export async function getPublicSettings(): Promise<PublicStoreSettings | null> {
  try {
    const res = await api<unknown>('/api/settings/public');
    return unwrapApiData<PublicStoreSettings>(res);
  } catch {
    return null;
  }
}
