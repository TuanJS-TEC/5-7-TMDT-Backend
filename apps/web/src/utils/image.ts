const PICSUM_BASE = 'https://picsum.photos';

export function resolveListingImageUrl(url: string | null | undefined, seed: string): string {
  const fallback = `${PICSUM_BASE}/seed/${seed}/800/500`;
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed.replace(/^\/+/, '')}`;
}

export function fallbackListingImage(seed: string): string {
  return `${PICSUM_BASE}/seed/${seed}/800/500`;
}
