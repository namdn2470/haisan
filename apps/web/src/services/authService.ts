'use client';

import {
  api,
  getToken,
  setToken,
  clearToken,
  isLoggedIn,
} from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

// ============================================================
// Types
// ============================================================

export type LoginResult = {
  token: string;
  user: {
    id: string;
    phone: string;
    fullName: string;
    email?: string;
    role: string;
  };
};

export type RegisterResult = LoginResult;

export type AuthState = {
  isLoggedIn: boolean;
  token: string | null;
  user: LoginResult['user'] | null;
};

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

// ============================================================
// Auth services
// ============================================================

export async function login(
  phone: string,
  password: string
): Promise<LoginResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || !password) {
    throw new Error('Vui lòng nhập số điện thoại và mật khẩu');
  }

  const res = await api<ApiResponse<LoginResult>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: normalizedPhone, password }),
  });
  setToken(res.data.token, res.data.user);
  return res.data;
}

export async function register(
  phone: string,
  password: string,
  fullName: string
): Promise<RegisterResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || !password) {
    throw new Error('Vui lòng nhập số điện thoại và mật khẩu');
  }
  if (!fullName.trim()) {
    throw new Error('Vui lòng nhập họ và tên');
  }

  const res = await api<ApiResponse<RegisterResult>>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone: normalizedPhone, password, fullName: fullName.trim() }),
  });
  setToken(res.data.token, res.data.user);
  return res.data;
}

export function logout() {
  clearToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hsbx_demo_user');
  }
}

export { getToken, setToken, clearToken, isLoggedIn };

// ============================================================
// User profile service
// ============================================================

export type Profile = {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  role: string;
  status?: string;
};

export async function getMe(): Promise<Profile | null> {
  if (!isLoggedIn()) return null;
  try {
    const res = await api<ApiResponse<Profile>>('/api/auth/me');
    return res.data ?? null;
  } catch {
    return null;
  }
}
