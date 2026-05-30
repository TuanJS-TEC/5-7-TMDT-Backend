import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';

import type { AuthSession, SessionUser, UserRole } from '@car-marketplace/api-contract';

export type { UserRole, SessionUser };

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  registerVerify: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  setSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_TOKEN = 'car_mp_token';
const STORAGE_USER = 'car_mp_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_TOKEN),
  );
  const [user, setUser] = useState<SessionUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });

  const persist = useCallback((session: AuthSession) => {
    localStorage.setItem(STORAGE_TOKEN, session.accessToken);
    localStorage.setItem(STORAGE_USER, JSON.stringify(session.user));
    setToken(session.accessToken);
    setUser(session.user);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const session = await api<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
      skipAuth: true,
    });
    persist(session);
  }, [persist]);

  const registerVerify = useCallback(async (phone: string, code: string) => {
    const session = await api<AuthSession>('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      skipAuth: true,
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'CarMarketplaceWeb/1.0',
      },
    });
    persist(session);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback(
    (session: AuthSession) => {
      persist(session);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      registerVerify,
      logout,
      setSession,
    }),
    [user, token, login, registerVerify, logout, setSession],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
