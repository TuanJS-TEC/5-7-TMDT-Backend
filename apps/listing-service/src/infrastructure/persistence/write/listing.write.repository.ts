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

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
