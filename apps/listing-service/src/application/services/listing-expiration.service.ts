import { Injectable, Logger } from '@nestjs/common';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { ListingWriteRepository } from '../../infrastructure/persistence/write/listing.write.repository';
import { ListingExpirationNotificationService } from './listing-expiration-notification.service';

export type ListingExpirationTriggerSource = 'cron' | 'manual';

export interface ListingExpirationRunResult {
  source: ListingExpirationTriggerSource;
  executedAt: string;
  expiredCount: number;
  expiredListingIds: string[];
  notifiedSellerIds: string[];
  message: string;
}

@Injectable()
export class ListingExpirationService {
  private readonly logger = new Logger(ListingExpirationService.name);

  constructor(
    private readonly listingReadRepository: ListingReadRepository,
    private readonly listingWriteRepository: ListingWriteRepository,
    private readonly listingExpirationNotificationService: ListingExpirationNotificationService,
  ) {}

  async runAutoExpire(
    source: ListingExpirationTriggerSource,
    asOf: Date = new Date(),
  ): Promise<ListingExpirationRunResult> {
    const expiredCandidates = await this.listingReadRepository.findApprovedExpired(asOf);

    if (expiredCandidates.length === 0) {
      const message = 'Khong co tin nao het han';
      this.logger.log(`UC56 ${source}: ${message}`);
      return {
        source,
        executedAt: asOf.toISOString(),
        expiredCount: 0,
        expiredListingIds: [],
        notifiedSellerIds: [],
        message,
      };
    }

    const sellerToListingIds = new Map<string, string[]>();
    const expiredListingIds: string[] = [];

    for (const listing of expiredCandidates) {
      await this.listingWriteRepository.expire(listing.id);
      expiredListingIds.push(listing.id);

      const current = sellerToListingIds.get(listing.sellerId) ?? [];
      current.push(listing.id);
      sellerToListingIds.set(listing.sellerId, current);
    }

    const notifiedSellerIds: string[] = [];
    for (const [sellerUserId, listingIds] of sellerToListingIds.entries()) {
      try {
        await this.listingExpirationNotificationService.notifySellerListingsExpired({
          sellerUserId,
          listingIds,
          occurredAtIso: asOf.toISOString(),
        });
        notifiedSellerIds.push(sellerUserId);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `UC56 notify failed seller=${sellerUserId}: ${detail}`,
        );
      }
    }

    const message = `Da an ${expiredListingIds.length} tin het han`;
    this.logger.log(
      `UC56 ${source}: ${message}; notifiedSellers=${notifiedSellerIds.length}`,
    );

    return {
      source,
      executedAt: asOf.toISOString(),
      expiredCount: expiredListingIds.length,
      expiredListingIds,
      notifiedSellerIds,
      message,
    };
  }
}
