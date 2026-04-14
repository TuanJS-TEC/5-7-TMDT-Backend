/** UC16 — Gói tin đăng (basic / premium / vip) */
export type ListingPackageType = 'basic' | 'premium' | 'vip';

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
    public fuelType: string,
    /** Hộp số: automatic | manual */
    public transmission: string,
    public status: ListingStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
    /** Lý do từ chối (UC16 A1) */
    public rejectionReason?: string,
  ) {}

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
}
