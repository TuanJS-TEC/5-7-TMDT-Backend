import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'listings' })
export class ListingOrmEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Giá VND — dùng bigint an toàn cho số lớn */
  @Column({ type: 'bigint' })
  priceVnd!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  /** UC16 — gói tin: basic | premium | vip */
  @Column({ type: 'varchar', length: 32, default: 'basic' })
  packageType!: string;

  /** UC16 — mảng URL ảnh xe, lưu dưới dạng simple-array */
  @Column({ type: 'simple-array', nullable: true })
  imageUrls!: string[];

  /** Hãng xe, ví dụ: Toyota, Honda */
  @Column({ type: 'varchar', length: 100 })
  carMake!: string;

  /** Dòng xe, ví dụ: Camry, City */
  @Column({ type: 'varchar', length: 100 })
  carModel!: string;

  /** Năm sản xuất */
  @Column({ type: 'int' })
  carYear!: number;

  /** Số km đã đi */
  @Column({ type: 'int', default: 0 })
  mileageKm!: number;

  /** Loại nhiên liệu: petrol | diesel | electric | hybrid */
  @Column({ type: 'varchar', length: 32 })
  fuelType!: string;

  /** Hộp số: automatic | manual */
  @Column({ type: 'varchar', length: 32 })
  transmission!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'int', default: 0 })
  shareCount!: number;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  favoriteCount!: number;

  @Column({ type: 'int', default: 0 })
  contactCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  pushedAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  featuredUntil?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  /** UC16 A1 — lý do từ chối từ admin */
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ type: 'text', nullable: true })
  modificationRequestDetails?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  modificationRequestedBy?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  modificationRequestedAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  imageAiFailureCount!: number;

  @Column({ type: 'boolean', default: false })
  manualImageReviewRequested!: boolean;

  @Column({ type: 'text', nullable: true })
  pendingManualReviewImageUrl?: string | null;

  @Column({ type: 'varchar', length: 64, default: 'none' })
  imageModerationState!: string;

  @Column({ type: 'timestamptz', nullable: true })
  removedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  removedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  adminRemovalReason?: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;
}
