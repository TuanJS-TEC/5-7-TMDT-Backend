import type {
  ListingStatus,
  ListingPackageType,
} from '../../domain/entities/listing.entity';

export interface ListingResponseDto {
  id: string;
  title: string;
  description: string;
  priceVnd: number;
  sellerId: string;
  /** UC16 — gói tin đã chọn */
  packageType: ListingPackageType;
  /** UC16 — danh sách URL ảnh xe */
  imageUrls: string[];
  carMake: string;
  carModel: string;
  carYear: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  /** UC16 A1 — lý do từ chối */
  rejectionReason?: string;
}
