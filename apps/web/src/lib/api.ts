// ============================================================
// API Client — enhanced with timeout, graceful fallback,
// and consistent error handling
// ============================================================

export type ApiError = Error & { status?: number; data?: unknown };

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export type ApiClientOptions = RequestInit & {
  timeout?: number;
};

const DEFAULT_TIMEOUT = 10000;
const TOKEN_KEY = 'token';
const SESSION_KEY = 'hsbx_auth_session';
const TOKEN_COOKIE = 'hsbx_token';

export type AuthSessionUser = {
  id: string;
  phone?: string;
  email?: string;
  fullName?: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user?: AuthSessionUser | null;
  issuedAt: number;
  expiresAt: number;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '';

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return API_BASE_URL;
  return localStorage.getItem('api_base') || API_BASE_URL;
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(window.atob(normalized));
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const session = JSON.parse(stored) as AuthSession;
      if (
        !session?.token ||
        session.token.startsWith('demo-token-') ||
        !decodeJwtExpiry(session.token) ||
        Date.now() >= session.expiresAt
      ) {
        clearToken();
        return null;
      }
      if (token !== session.token) localStorage.setItem(TOKEN_KEY, session.token);
      return session;
    }
    if (!token) return null;

    const expiresAt = decodeJwtExpiry(token);
    if (!expiresAt) {
      clearToken();
      return null;
    }
    const session: AuthSession = { token, issuedAt: Date.now(), expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch {
    clearToken();
    return null;
  }
}

export function getStoredUser(): AuthSessionUser | null {
  return getAuthSession()?.user ?? null;
}

export async function api<T = unknown>(
  path: string,
  opts?: ApiClientOptions
): Promise<T> {
  const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;
  const { timeout: _timeout, ...fetchOpts } = opts ?? {};

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    const offlineErr: ApiError = new Error('API backend is not configured.');
    offlineErr.status = 0;
    throw offlineErr;
  }

  const token =
    typeof window !== 'undefined' ? getToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...fetchOpts,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      let msg = '';
      if (typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>;
        if (d?.message) {
          msg = Array.isArray(d.message)
            ? (d.message as string[]).join(', ')
            : String(d.message);
        } else if ((d as Record<string, { message?: string }>)?.error?.message) {
          msg = (d.error as { message: string }).message;
        }
      }
      if (!msg) msg = `API error: ${res.status}`;

      const err: ApiError = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      const timeoutErr: ApiError = new Error('Hết thời gian kết nối. Vui lòng thử lại.');
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}

export const apiClient = {
  get<T = unknown>(path: string, opts?: ApiClientOptions) {
    return api<T>(path, { ...opts, method: 'GET' });
  },
  post<T = unknown>(path: string, body?: unknown, opts?: ApiClientOptions) {
    return api<T>(path, {
      ...opts,
      method: 'POST',
      body: body === undefined ? opts?.body : JSON.stringify(body),
    });
  },
  put<T = unknown>(path: string, body?: unknown, opts?: ApiClientOptions) {
    return api<T>(path, {
      ...opts,
      method: 'PUT',
      body: body === undefined ? opts?.body : JSON.stringify(body),
    });
  },
  delete<T = unknown>(path: string, opts?: ApiClientOptions) {
    return api<T>(path, { ...opts, method: 'DELETE' });
  },
};

// ============================================================
// Image URL helper
// Maps shorthand image names to their actual public paths.
// Falls back to Pexels CDN or a placeholder if not found.
// ============================================================
export const img = (name: string): string => {
  const imageMap: Record<string, string> = {
    // ---- Category images (real photos from Pexels) ----
    'cat-tom.svg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-cua-ghe.svg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-ca.svg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-muc.svg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-oc-so.svg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-combo.svg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-hai-san-so-che.svg':
      'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900',

    // ---- Category/Product JPG fallbacks use real food photos ----
    'cat-tom.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-cua.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-ca.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-muc.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-oc.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-combo.jpg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cat-so-che.jpg':
      'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-tom.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-ghe.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-cua.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-ca.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-muc.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'prod-oc.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',

    // ---- Specific product images (real photos) ----
    'ca-hong-bien-1.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ca-hong-bien-2.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ca-hong-bien-3.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ghe-xanh-size-3-1.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ghe-xanh-size-3-2.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ghe-xanh-size-3-3.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'combo-hai-san-gia-dinh-1.jpg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'combo-hai-san-gia-dinh-2.jpg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'combo-hai-san-gia-dinh-3.jpg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'muc-ong-size-20-30-1.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'muc-ong-size-20-30-2.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'muc-ong-size-20-30-3.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'oc-huong-size-l-1.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'oc-huong-size-l-2.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'oc-huong-size-l-3.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'tom-su-size-l-1.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'tom-su-size-l-2.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'tom-su-size-l-3.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',

    // ---- Pexels CDN fallbacks for common categories ----
    'tom-fallback.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
    'cua-fallback.jpg':
      'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900',
    'ca-fallback.jpg':
      'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900',
    'muc-fallback.jpg':
      'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900',
    'oc-fallback.jpg':
      'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900',
    'combo-fallback.jpg':
      'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900',
    'so-che-fallback.jpg':
      'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900',
    'logo.jpg':
      'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900',
  };

  return imageMap[name] || 'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900';
};

// ============================================================
// Auth helpers
// ============================================================
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getAuthSession()?.token ?? null;
}

export function setToken(token: string, user?: AuthSessionUser | null) {
  if (typeof window !== 'undefined') {
    const expiresAt = decodeJwtExpiry(token);
    if (!expiresAt) {
      throw new Error('Invalid auth token');
    }
    const session: AuthSession = {
      token,
      user: user ?? getStoredUser(),
      issuedAt: Date.now(),
      expiresAt,
    };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(session))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${SESSION_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
