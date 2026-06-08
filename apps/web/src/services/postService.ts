import { api } from '@/lib/api';
import { unwrapApiData, unwrapApiList } from '@/lib/api-response';

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  thumbnailUrl?: string | null;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  viewCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  authorName?: string | null;
};

export async function getPublishedPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const query = new URLSearchParams();
  query.set('status', 'PUBLISHED');
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  return api<unknown>(`/api/posts?${query.toString()}`);
}

export async function getPostBySlug(slug: string) {
  const res = await api<unknown>(`/api/posts/slug/${encodeURIComponent(slug)}`);
  return unwrapApiData<Post>(res);
}

export async function getRelatedPosts(currentSlug: string, limit = 3) {
  const res = await getPublishedPosts({ limit: limit + 1 });
  const posts = unwrapApiList<Post>(res);
  return posts.filter((post) => post.slug !== currentSlug).slice(0, limit);
}
