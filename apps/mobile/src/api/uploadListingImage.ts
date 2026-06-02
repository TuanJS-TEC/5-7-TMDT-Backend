import { getStoredToken, apiBase } from './client';

export interface UploadListingImageResult {
  imageUrl: string;
  message?: string;
}

export async function uploadListingImage(
  listingId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadListingImageResult> {
  const token = await getStoredToken();
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const res = await fetch(`${apiBase}/listings/${listingId}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : 'Upload thất bại';
    throw new Error(msg);
  }
  return data as UploadListingImageResult;
}
