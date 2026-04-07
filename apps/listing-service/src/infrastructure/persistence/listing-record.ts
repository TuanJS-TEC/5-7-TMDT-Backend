import type {
  ListingStatus,
  ListingPackageType,
} from '../../domain/entities/listing.entity';

export interface ListingRecord {
  id: string;
  title: string;
  description: string;
  priceVnd: number;
  sellerId: string;
  /** UC16 — gói tin người bán chọn */
  packageType: ListingPackageType;
  /** UC16 — mảng URL ảnh xe */
  imageUrls: string[];
  /** Hãng xe */
  carMake: string;
  /** Dòng xe */
  carModel: string;
  /** Năm sản xuất */
  carYear: number;
  /** Số km đã đi */
  mileageKm: number;
  /** Loại nhiên liệu: petrol | diesel | electric | hybrid */
  fuelType: string;
  /** Hộp số: automatic | manual */
  transmission: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  /** UC16 A1 — lý do từ chối */
  rejectionReason?: string;
  /** UC17 — số lần AI từ chối ảnh */
  imageAiFailureCount?: number;
  /** UC17 — có ảnh đang chờ QTV duyệt thủ công không */
  manualImageReviewRequested?: boolean;
  /** UC17 — URL ảnh đang chờ QTV duyệt */
  pendingManualReviewImageUrl?: string;
  /** UC17 — trạng thái kiểm duyệt ảnh: 'none' | 'pending_manual_review' */
  imageModerationState?: string;
}
