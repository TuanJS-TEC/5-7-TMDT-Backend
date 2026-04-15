import type {
  ListingStatus,
  ListingPackageType,
  FuelType,
  TransmissionType,
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
  // fuelType: string;
  // transmission: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  /** UC16 A1 — lý do từ chối */
  rejectionReason?: string;
  shareCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  contactCount?: number;
  pushedAt?: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  /** UC33 — chi tiết quản trị viên yêu cầu seller chỉnh sửa */
  modificationRequestDetails?: string;
  /** UC33 — quản trị viên đã yêu cầu sửa */
  modificationRequestedBy?: string;
  /** UC33 — thời điểm yêu cầu sửa */
  modificationRequestedAt?: string;
  /** UC38 */
  removedAt?: string;
  removedBy?: string;
  adminRemovalReason?: string;
  expiresAt: string;
  isDeleted: boolean;
}
