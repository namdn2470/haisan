'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  clearToken as clearStoredToken,
  getAuthSession,
  setToken as storeToken,
} from '@/lib/api';
import type { AuthSessionUser } from '@/lib/api';

// ============================================================
// Types
// ============================================================

export type AuthContextUser = AuthSessionUser;

export type AuthContextValue = {
  user: AuthContextUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthContextUser) => void;
  logout: () => void;
};

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Bootstrap: read from localStorage on mount
  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      setUser(session.user ?? null);
    }
    setIsLoading(false);
  }, []);

  // Login: store token + user and notify all listeners
  const login = useCallback((token: string, authUser: AuthContextUser) => {
    storeToken(token, authUser);
    setUser(authUser);
    listenersRef.current.forEach(fn => fn());
  }, []);

  // Logout: clear and notify
  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    listenersRef.current.forEach(fn => fn());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
