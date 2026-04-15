/** UC16 — Gói tin đăng (basic / premium / vip) */
//export type ListingPackageType = 'basic' | 'premium' | 'vip';
export enum ListingPackageType { // THAY ĐỔI TỪ type SANG enum
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'modification_requested'
  | 'approved'
  | 'rejected'
  | 'sold'
  /** UC38 — đã gỡ hiển thị (không còn active công khai) */
  | 'removed';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'automatic' | 'manual';

export class Listing {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public priceVnd: number,
    public sellerId: string,
    public packageType: ListingPackageType,
    /** Mảng URL ảnh (client tự upload lên CDN trước) */
    public imageUrls: string[],
    /** Hãng xe, ví dụ: Toyota, Honda */
    public carMake: string,
    /** Dòng xe, ví dụ: Camry, City */
    public carModel: string,
    /** Năm sản xuất */
    public carYear: number,
    /** Số km đã đi */
    public mileageKm: number,
    /** Loại nhiên liệu */
    // public fuelType: string,
    public fuelType: FuelType,
    /** Hộp số: automatic | manual */
    // public transmission: string,
    public transmission: TransmissionType,
    public status: ListingStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public expiresAt: Date,
    public isDeleted: boolean,
    /** Lý do từ chối (UC16 A1) */
    public rejectionReason?: string,
    // Các trường khác từ ListingRecord nếu cần logic nghiệp vụ trực tiếp trên domain entity
    public shareCount?: number,
    public viewCount?: number,
    public favoriteCount?: number,
    public contactCount?: number,
    public pushedAt?: Date,
    public isFeatured?: boolean,
    public featuredUntil?: Date,
    public modificationRequestDetails?: string,
    public modificationRequestedBy?: string,
    public modificationRequestedAt?: Date,
    public removedAt?: Date,
    public removedBy?: string,
    public adminRemovalReason?: string,
  ) {
    // Đảm bảo giá trị mặc định nếu không được cung cấp (từ constructor hoặc khi tạo mới)
    this.expiresAt = expiresAt;
    this.isDeleted = isDeleted ?? false;
    this.shareCount = shareCount ?? 0;
    this.viewCount = viewCount ?? 0;
    this.favoriteCount = favoriteCount ?? 0;
    this.contactCount = contactCount ?? 0;
    this.isFeatured = isFeatured ?? false;
  }

  approve(): void {
    this.status = 'approved';
    this.updatedAt = new Date();
  }

  /** UC16 A1 — admin từ chối bài đăng */
  reject(reason: string): void {
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  markSold(): void {
    this.status = 'sold';
    this.updatedAt = new Date();
  }

  // UC26 (soft delete)
  softDelete(): void {
    this.isDeleted = true;
    this.status = 'removed';
    this.updatedAt = new Date();
  }

  // UC24
  renew(newExpiresAt: Date, newPackageType?: ListingPackageType): void {
    this.expiresAt = newExpiresAt;
    if (newPackageType) {
      this.packageType = newPackageType;
    }
    this.status = 'approved'; // Khi gia hạn, tin có thể trở lại trạng thái approved
    this.updatedAt = new Date();
  }
}
