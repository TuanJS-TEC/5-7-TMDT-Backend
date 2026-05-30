import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '@car-marketplace/api-contract';

export const STORAGE_TOKEN = 'car_mp_token';
export const STORAGE_USER = 'car_mp_user';
export const STORAGE_REFRESH = 'car_mp_refresh_token';

const apiHost = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:3000';
export const apiBase = `${apiHost}/api/v1`;
export const uploadsBase = apiHost;

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(parseMessage(body));
    this.name = 'ApiError';
  }
}

function parseMessage(body: unknown): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (Array.isArray(o.message)) return o.message.join(', ');
    if (typeof o.error === 'string') return o.error;
  }
  return 'Yêu cầu thất bại';
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_TOKEN);
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${apiBase}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export async function persistSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_TOKEN, session.accessToken);
  await SecureStore.setItemAsync(STORAGE_USER, JSON.stringify(session.user));
  if ('refreshToken' in session && typeof session.refreshToken === 'string') {
    await SecureStore.setItemAsync(STORAGE_REFRESH, session.refreshToken);
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_USER);
  await SecureStore.deleteItemAsync(STORAGE_REFRESH);
}

export async function refreshAccessToken(): Promise<AuthSession | null> {
  const refreshToken = await SecureStore.getItemAsync(STORAGE_REFRESH);
  if (!refreshToken) return null;
  try {
    const session = await api<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
    await persistSession(session);
    return session;
  } catch {
    await clearSession();
    return null;
  }
}
