import { apiBase, ApiError } from './client';

export type UploadListingImageResult = {
  ok: boolean;
  imageUrl?: string;
  requiresManualReview?: boolean;
  message?: string;
};

export async function uploadListingImage(
  listingId: string,
  file: File,
): Promise<UploadListingImageResult> {
  const form = new FormData();
  form.append('file', file, file.name);

  const token = localStorage.getItem('car_mp_token');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(
    `${apiBase}/listings/${encodeURIComponent(listingId)}/images`,
    {
      method: 'POST',
      headers,
      body: form,
    },
  );

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as UploadListingImageResult;
}
