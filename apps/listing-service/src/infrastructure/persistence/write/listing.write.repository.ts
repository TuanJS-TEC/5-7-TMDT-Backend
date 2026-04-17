import { Inject, Injectable } from '@nestjs/common';
import { LISTING_STORE } from '../listing.store.token';
import type { ListingRecord } from '../listing-record';

@Injectable()
export class ListingWriteRepository {
  constructor(
    @Inject(LISTING_STORE)
    private readonly store: Map<string, ListingRecord>,
  ) {}

  async create(
    data: Omit<ListingRecord, 'approvedAt' | 'rejectionReason'>,
  ): Promise<ListingRecord> {
    const record: ListingRecord = { ...data };
    this.store.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<ListingRecord | undefined> {
    return this.store.get(id);
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        ListingRecord,
        | 'title'
        | 'description'
        | 'priceVnd'
        | 'status'
        | 'approvedAt'
        | 'rejectionReason'
        | 'modificationRequestDetails'
        | 'modificationRequestedBy'
        | 'modificationRequestedAt'
        | 'packageType'
        | 'imageUrls'
        | 'carMake'
        | 'carModel'
        | 'carYear'
        | 'mileageKm'
        | 'fuelType'
        | 'transmission'
        | 'imageAiFailureCount'
        | 'manualImageReviewRequested'
        | 'pendingManualReviewImageUrl'
        | 'imageModerationState'
        | 'removedAt'
        | 'removedBy'
        | 'adminRemovalReason'
        | 'expiresAt'
        | 'isDeleted'
      >
    >,
  ): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    const updated: ListingRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
  }

  async approve(id: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    const approvedAt = new Date();
    const updated: ListingRecord = {
      ...existing,
      status: 'approved',
      approvedAt,
      updatedAt: approvedAt,
    };
    this.store.set(id, updated);
  }

  /** UC56 — tự động chuyển tin active sang expired khi hết hạn gói hiển thị */
  async expire(id: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: ListingRecord = {
      ...existing,
      status: 'expired',
      updatedAt: now,
    };
    this.store.set(id, updated);
  }

  /** UC16 A1 — Admin từ chối / huỷ bài đăng */
  async reject(id: string, reason: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: ListingRecord = {
      ...existing,
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: now,
    };
    this.store.set(id, updated);
  }

  /** UC33 — QTV yêu cầu seller chỉnh sửa trước khi duyệt */
  async requestModification(
    id: string,
    moderatorId: string,
    details: string,
  ): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: ListingRecord = {
      ...existing,
      status: 'modification_requested',
      modificationRequestedBy: moderatorId,
      modificationRequestDetails: details,
      modificationRequestedAt: now,
      updatedAt: now,
    };
    this.store.set(id, updated);
  }

  async incrementShareCount(id: string): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;

    const updated: ListingRecord = {
      ...existing,
      shareCount: (existing.shareCount ?? 0) + 1,
    };
    this.store.set(id, updated);
    return true;
  }

  async incrementViewCount(id: string): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;

    const updated: ListingRecord = {
      ...existing,
      viewCount: (existing.viewCount ?? 0) + 1,
    };
    this.store.set(id, updated);
    return true;
  }

  async updatePushedAt(id: string, date: Date): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;

    const updated: ListingRecord = {
      ...existing,
      pushedAt: date,
    };
    this.store.set(id, updated);
    return true;
  }

  async featureListing(id: string, days: number): Promise<boolean> {
    const existing = this.store.get(id);
    if (!existing) return false;

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const updated: ListingRecord = {
      ...existing,
      isFeatured: true,
      featuredUntil: featuredUntil,
    };
    this.store.set(id, updated);
    return true;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /**
   * UC38 — chỉ tin đang active công khai (`approved`) → `removed` (gỡ hiển thị).
   */
  softRemoveAllActiveBySellerId(
    sellerId: string,
    meta: { moderatorId: string; reason?: string },
  ): string[] {
    const ids: string[] = [];
    const now = new Date();
    for (const [id, r] of this.store) {
      if (r.sellerId === sellerId && r.status === 'approved') {
        const updated: ListingRecord = {
          ...r,
          status: 'removed',
          removedAt: now,
          removedBy: meta.moderatorId,
          adminRemovalReason: meta.reason?.trim() || undefined,
          updatedAt: now,
        };
        this.store.set(id, updated);
        ids.push(id);
      }
    }
    return ids;
  }
}
