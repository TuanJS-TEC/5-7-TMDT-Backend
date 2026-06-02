const PICSUM_BASE = 'https://picsum.photos';

/** Chuẩn hóa URL ảnh tin đăng (hỗ trợ path đầy đủ hoặc chỉ tên file). */
export function resolveListingImageUrl(
  url: string | null | undefined,
  listingId: string,
): string {
  const fallback = `${PICSUM_BASE}/seed/${listingId}/800/500`;
  if (!url) return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.startsWith('/uploads/')) return trimmed;

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed.replace(/^\/+/, '')}`;
  }

  // DB cũ / lỗi: chỉ lưu tên file (vd. 80a05378-....jpg)
  if (!trimmed.includes('/') && /\.(jpe?g|png|webp|gif)$/i.test(trimmed)) {
    return `/uploads/listings/${listingId}/${trimmed}`;
  }

  if (trimmed.startsWith('/')) return trimmed;

  return `/${trimmed.replace(/^\/+/, '')}`;
}

export function fallbackListingImage(seed: string): string {
  return `${PICSUM_BASE}/seed/${seed}/800/500`;
}
