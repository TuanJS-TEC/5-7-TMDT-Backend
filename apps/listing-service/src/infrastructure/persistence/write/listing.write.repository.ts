import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ListingRecord } from '../listing-record';
import { ListingOrmEntity } from '../typeorm/listing.orm.entity';

@Injectable()
export class ListingWriteRepository {
  constructor(
    @InjectRepository(ListingOrmEntity)
    private readonly repo: Repository<ListingOrmEntity>,
  ) {}

  async create(
    data: Omit<ListingRecord, 'approvedAt' | 'rejectionReason'>,
  ): Promise<ListingRecord> {
    const created = this.repo.create({
      ...(data as unknown as Partial<ListingOrmEntity>),
      priceVnd: String(data.priceVnd),
    });
    const saved = await this.repo.save(created);
    return saved as unknown as ListingRecord;
  }

  async findById(id: string): Promise<ListingRecord | undefined> {
    const row = await this.repo.findOneBy({ id } as any);
    return row as unknown as ListingRecord | undefined;
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
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }
    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      ...(patch as unknown as Partial<ListingOrmEntity>),
      priceVnd: patch.priceVnd !== undefined ? String(patch.priceVnd) : existing.priceVnd,
    };
    await this.repo.save(updated as ListingOrmEntity);
  }

  async approve(id: string): Promise<void> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }
    const approvedAt = new Date();
    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      status: 'approved',
      approvedAt,
    };
    await this.repo.save(updated as ListingOrmEntity);
  }

  /** UC56 — tự động chuyển tin active sang expired khi hết hạn gói hiển thị */
  async expire(id: string): Promise<void> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      status: 'expired',
    };
    await this.repo.save(updated as ListingOrmEntity);
  }

  /** UC16 A1 — Admin từ chối / huỷ bài đăng */
  async reject(id: string, reason: string): Promise<void> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      status: 'rejected',
      rejectionReason: reason,
    };
    await this.repo.save(updated as ListingOrmEntity);
  }

  /** UC33 — QTV yêu cầu seller chỉnh sửa trước khi duyệt */
  async requestModification(
    id: string,
    moderatorId: string,
    details: string,
  ): Promise<void> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }
    const now = new Date();
    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      status: 'modification_requested',
      modificationRequestedBy: moderatorId,
      modificationRequestDetails: details,
      modificationRequestedAt: now,
    };
    await this.repo.save(updated as ListingOrmEntity);
  }

  async incrementShareCount(id: string): Promise<boolean> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) return false;

    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      shareCount: (existing.shareCount ?? 0) + 1,
    };
    await this.repo.save(updated as ListingOrmEntity);
    return true;
  }

  async incrementViewCount(id: string): Promise<boolean> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) return false;

    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      viewCount: (existing.viewCount ?? 0) + 1,
    };
    await this.repo.save(updated as ListingOrmEntity);
    return true;
  }

  async updatePushedAt(id: string, date: Date): Promise<boolean> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) return false;

    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      pushedAt: date,
    };
    await this.repo.save(updated as ListingOrmEntity);
    return true;
  }

  async featureListing(id: string, days: number): Promise<boolean> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) return false;

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const updated: Partial<ListingOrmEntity> = {
      ...existing,
      isFeatured: true,
      featuredUntil,
    };
    await this.repo.save(updated as ListingOrmEntity);
    return true;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id as any);
  }

  /**
   * UC38 — chỉ tin đang active công khai (`approved`) → `removed` (gỡ hiển thị).
   */
  async softRemoveAllActiveBySellerId(
    sellerId: string,
    meta: { moderatorId: string; reason?: string },
  ): Promise<string[]> {
    const rows = await this.repo.find({
      where: { sellerId, status: 'approved' },
    });
    const ids: string[] = [];
    const now = new Date();
    for (const row of rows) {
      row.status = 'removed';
      row.removedAt = now;
      row.removedBy = meta.moderatorId;
      row.adminRemovalReason = meta.reason?.trim() || null;
      ids.push(row.id);
    }
    if (rows.length) await this.repo.save(rows);
    return ids;
  }
}
