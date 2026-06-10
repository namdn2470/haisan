export function unwrapApiData<T>(response: unknown): T | null {
  if (response == null) return null;
  if (typeof response !== 'object') return response as T;

  const obj = response as Record<string, unknown>;

  // Standard backend envelope: { success, message, data }
  if ('success' in obj && 'data' in obj) {
    return obj.data as T;
  }
  // Plain { data } wrapper (no success field)
  if ('data' in obj) {
    return obj.data as T;
  }
  return response as T;
}

export function unwrapApiList<T>(response: unknown): T[] {
  const data = unwrapApiData<unknown>(response);
  // data is already an array
  if (Array.isArray(data)) return data as T[];
  // data is paginated { data: [...], total } or wrapped { data: [...] }
  if (data != null && typeof data === 'object' && 'data' in (data as object)) {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  // fallback: response itself is an array
  if (Array.isArray(response)) return response as T[];
  return [];
}

export type ApiPage<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function unwrapApiPage<T>(response: unknown): ApiPage<T> {
  const empty: ApiPage<T> = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  const outer = unwrapApiData<unknown>(response);
  if (outer == null) return empty;
  // Paginated: { data: [...], total, page, limit, totalPages }
  if (typeof outer === 'object' && 'data' in (outer as object) && 'total' in (outer as object)) {
    const p = outer as Record<string, unknown>;
    const items = Array.isArray(p.data) ? (p.data as T[]) : [];
    return {
      data: items,
      total: Number(p.total ?? 0),
      page: Number(p.page ?? 1),
      limit: Number(p.limit ?? 20),
      totalPages: Number(p.totalPages ?? Math.ceil(Number(p.total ?? 0) / Number(p.limit ?? 20))),
    };
  }
  // Plain array without pagination metadata
  const list = unwrapApiList<T>(response);
  return { data: list, total: list.length, page: 1, limit: list.length, totalPages: 1 };
}
