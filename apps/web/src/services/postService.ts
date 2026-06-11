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

const EMPTY_POSTS_RESPONSE = { success: true, data: { data: [], total: 0, page: 1, limit: 12, totalPages: 0 } };

export async function getPublishedPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<unknown> {
  try {
    const query = new URLSearchParams();
    query.set('status', 'PUBLISHED');
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return await api<unknown>(`/api/posts?${query.toString()}`);
  } catch {
    return EMPTY_POSTS_RESPONSE;
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await api<unknown>(`/api/posts/slug/${encodeURIComponent(slug)}`);
    return unwrapApiData<Post>(res);
  } catch {
    return null;
  }
}

export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<Post[]> {
  try {
    const res = await getPublishedPosts({ limit: limit + 1 });
    const posts = unwrapApiList<Post>(res);
    return posts.filter((post) => post.slug !== currentSlug).slice(0, limit);
  } catch {
    return [];
  }
}
