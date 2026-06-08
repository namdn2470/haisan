'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAdminDataOptions<T> {
  fetchFn: () => Promise<{ data: T }>;
  deps?: any[];
  enabled?: boolean;
}

interface UseAdminDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminData<T>({
  fetchFn,
  deps = [],
  enabled = true,
}: UseAdminDataOptions<T>): UseAdminDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, ...deps]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

interface UseAdminListOptions<T> {
  fetchFn: (params?: any) => Promise<{ data: T[]; total: number; page: number; totalPages: number }>;
  params?: any;
  enabled?: boolean;
}

interface UseAdminListResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setParams: (params: any) => void;
}

export function useAdminList<T>({
  fetchFn,
  params = {},
  enabled = true,
}: UseAdminListOptions<T>): UseAdminListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState(params);

  const fetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn({ ...currentParams, page });
      setItems(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Admin list fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, page, JSON.stringify(currentParams)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateParams = useCallback((newParams: any) => {
    setCurrentParams(newParams);
    setPage(1);
  }, []);

  return {
    items,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetch,
    setParams: updateParams,
  };
}
