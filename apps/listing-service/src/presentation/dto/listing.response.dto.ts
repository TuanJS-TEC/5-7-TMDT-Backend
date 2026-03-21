import type { ListingStatus } from '../../domain/entities/listing.entity';

export interface ListingResponseDto {
  id: string;
  title: string;
  description: string;
  priceVnd: number;
  sellerId: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}
