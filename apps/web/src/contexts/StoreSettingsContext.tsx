'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type StoreSettingsContextValue = {
  settings: StoreSettingsData | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
};

export type StoreSettingsData = {
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

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  settings: null,
  loading: true,
  error: false,
  refetch: () => {},
});

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}

async function fetchPublicSettings(): Promise<StoreSettingsData | null> {
  try {
    const base = (() => {
      if (typeof window !== 'undefined') {
        const prot = window.location.protocol;
        const host = window.location.host;
        if (host.includes(':3000') || host.includes(':3012')) {
          return 'http://localhost:3001';
        }
        return `${prot}//${host}`;
      }
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    })();

    const res = await fetch(`${base}/api/settings/public`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) return json.data;
    if (json.storeName) return json;
    return null;
  } catch {
    return null;
  }
}

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchPublicSettings();
      setSettings(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, error, refetch: load }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
