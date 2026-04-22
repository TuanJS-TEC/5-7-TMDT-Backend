/** Base path: dev dùng proxy Vite `/api/v1`; production set VITE_API_BASE */
export const apiBase = import.meta.env.VITE_API_BASE
  ? `${String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')}/api/v1`
  : '/api/v1';

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
    if (o.message && typeof o.message === 'object') {
      const m = o.message as Record<string, unknown>;
      if (typeof m.message === 'string') return m.message;
    }
  }
  return 'Yêu cầu thất bại';
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = localStorage.getItem('car_mp_token');
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
