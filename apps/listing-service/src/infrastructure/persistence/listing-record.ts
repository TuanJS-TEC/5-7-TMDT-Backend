import type { ListingStatus } from '../../domain/entities/listing.entity';

export interface ListingRecord {
  id: string;
  title: string;
  description: string;
  priceVnd: number;
  sellerId: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
}
