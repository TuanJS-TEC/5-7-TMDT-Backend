import type { ListingStatus } from './entities/listing.entity';

/** Trạng thái hiển thị trên sàn (dev — không lọc theo isDeleted ở đây). */
export function isPubliclyVisible(
  status: ListingStatus | string,
  expiresAt?: Date | string | null,
  asOf: Date = new Date(),
): boolean {
  if (status !== 'approved') {
    return false;
  }
  if (!expiresAt) {
    return true;
  }
  return new Date(expiresAt) > asOf;
}

export const MODERATION_QUEUE_STATUSES: ListingStatus[] = [
  'pending',
  'modification_requested',
];

export const RENEWABLE_STATUSES: ListingStatus[] = ['approved', 'expired'];
