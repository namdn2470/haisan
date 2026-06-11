import { getApiBaseUrl } from '@/lib/api';

export type SiteConfigMap = Record<string, string>;

export async function getPublicConfig(): Promise<SiteConfigMap> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/config/public`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const json = await res.json();
    const configs: { key: string; value: string }[] = json?.data ?? [];
    if (!Array.isArray(configs)) return {};
    return Object.fromEntries(configs.map((c) => [c.key, c.value]));
  } catch {
    return {};
  }
}

export function parseConfigBool(map: SiteConfigMap, key: string, fallback = true): boolean {
  if (!(key in map)) return fallback;
  return map[key] !== 'false';
}
