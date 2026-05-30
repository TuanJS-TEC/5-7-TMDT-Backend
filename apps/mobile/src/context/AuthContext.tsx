import type { AuthSession, SessionUser } from '@car-marketplace/api-contract';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  api,
  clearSession,
  persistSession,
  refreshAccessToken,
  STORAGE_USER,
} from '../api/client';
import { registerPushToken } from '../lib/push';

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  registerVerify: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_USER);
        if (raw) {
          const parsed = JSON.parse(raw) as SessionUser;
          if (!cancelled) setUser(parsed);
        }
        const refreshed = await refreshAccessToken();
        if (!cancelled && refreshed) {
          setToken(refreshed.accessToken);
          setUser(refreshed.user);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(async (session: AuthSession) => {
    await persistSession(session);
    setToken(session.accessToken);
    setUser(session.user);
    try {
      await registerPushToken(session.user.id);
    } catch {
      /* push optional */
    }
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      const session = await api<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
        skipAuth: true,
      });
      await applySession(session);
    },
    [applySession],
  );

  const registerVerify = useCallback(
    async (phone: string, code: string) => {
      const session = await api<AuthSession>('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
        skipAuth: true,
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'CarMarketplaceMobile/1.0',
        },
      });
      await applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      registerVerify,
      logout,
      setSession: applySession,
    }),
    [user, token, loading, login, registerVerify, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
