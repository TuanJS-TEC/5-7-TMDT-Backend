/** Chuẩn hóa đường dẫn ảnh lưu trong DB (hỗ trợ bản ghi cũ chỉ có tên file). */
export function normalizeListingImageUrls(
  listingId: string,
  urls: string[] | null | undefined,
): string[] {
  if (!urls?.length) return [];

  return urls
    .map((raw) => {
      const trimmed = (raw ?? '').trim();
      if (!trimmed) return '';

      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith('/uploads/')) return trimmed;
      if (trimmed.startsWith('uploads/')) {
        return `/${trimmed.replace(/^\/+/, '')}`;
      }
      if (!trimmed.includes('/') && /\.(jpe?g|png|webp|gif)$/i.test(trimmed)) {
        return `/uploads/listings/${listingId}/${trimmed}`;
      }
      if (trimmed.startsWith('/')) return trimmed;
      return `/${trimmed.replace(/^\/+/, '')}`;
    })
    .filter(Boolean);
}
