import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ListingExpirationService } from '../../application/services/listing-expiration.service';

@Injectable()
export class ListingExpirationCron {
  private readonly logger = new Logger(ListingExpirationCron.name);

  constructor(
    private readonly listingExpirationService: ListingExpirationService,
  ) {}

  /**
   * UC56 — 00:00 moi ngay quet tin active da het han de auto an.
   */
  @Cron('0 0 * * *', { name: 'uc56-auto-expire-listings' })
  async runDailyAutoExpire(): Promise<void> {
    try {
      const result = await this.listingExpirationService.runAutoExpire('cron');
      this.logger.log(
        `UC56 cron done: expired=${result.expiredCount}, notified=${result.notifiedSellerIds.length}`,
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`UC56 cron failed: ${detail}`);
    }
  }
}
