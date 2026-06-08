export function unwrapApiData<T>(response: unknown): T | null {
  if (response == null) return null;
  if (typeof response !== 'object') return response as T;

  const obj = response as Record<string, unknown>;

  if ('data' in obj) {
    return obj.data as T;
  }
  if ('success' in obj && 'data' in obj) {
    return (obj as { success: boolean; data: T }).data;
  }
  return response as T;
}

export function unwrapApiList<T>(response: unknown): T[] {
  const data = unwrapApiData<T[]>(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(response)) return response as T[];
  return [];
}
