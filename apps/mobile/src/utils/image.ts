import { uploadsBase } from '../api/client';

export function resolveListingImageUrl(url: string | undefined, listingId: string): string {
  if (!url) return fallbackListingImage(listingId);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${uploadsBase}${url}`;
  return `${uploadsBase}/uploads/listings/${url}`;
}

export function fallbackListingImage(listingId: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(listingId)}/800/500`;
}
