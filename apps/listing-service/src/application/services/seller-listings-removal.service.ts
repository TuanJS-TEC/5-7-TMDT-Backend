import { Injectable } from '@nestjs/common';
import { ListingWriteRepository } from '../../infrastructure/persistence/write/listing.write.repository';
import { Uc38RemovalAuditWriteRepository } from '../../infrastructure/persistence/write/uc38-removal-audit.write.repository';
import type { Uc38RemovalSource } from '../../infrastructure/persistence/uc38-removal-audit-record';
import { v4 as uuidv4 } from 'uuid';

const UC38_EMPTY_MSG = 'Seller không có tin đăng Active nào.';

export interface RemoveAllActiveListingsInput {
  moderatorId: string;
  note?: string;
  reportId?: string;
  source: Uc38RemovalSource;
}

export interface RemoveAllActiveListingsResult {
  auditId: string;
  sellerId: string;
  listingIds: string[];
  count: number;
  empty: boolean;
  message?: string;
}

@Injectable()
export class SellerListingsRemovalService {
  constructor(
    private readonly listingWriteRepository: ListingWriteRepository,
    private readonly uc38AuditWrite: Uc38RemovalAuditWriteRepository,
  ) {}

  /**
   * UC38 — lấy tin `approved` của seller, chuyển sang `removed`, ghi audit.
   * A1: không có tin active → không đổi DB tin, vẫn ghi audit (count=0) + message.
   */
  async removeAllActiveListings(
    sellerId: string,
    input: RemoveAllActiveListingsInput,
  ): Promise<RemoveAllActiveListingsResult> {
    const listingIds = await this.listingWriteRepository.softRemoveAllActiveBySellerId(
      sellerId,
      {
        moderatorId: input.moderatorId,
        reason: input.note,
      },
    );

    const empty = listingIds.length === 0;
    const auditId = uuidv4();
    await this.uc38AuditWrite.save({
      id: auditId,
      sellerId,
      moderatorId: input.moderatorId,
      source: input.source,
      listingIds,
      reportId: input.reportId,
      note: input.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    return {
      auditId,
      sellerId,
      listingIds,
      count: listingIds.length,
      empty,
      message: empty ? UC38_EMPTY_MSG : undefined,
    };
  }
}
