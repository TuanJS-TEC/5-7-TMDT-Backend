import { Injectable, Logger } from '@nestjs/common';

export interface ListingExpiredNotificationInput {
  sellerUserId: string;
  listingIds: string[];
  occurredAtIso: string;
}

@Injectable()
export class ListingExpirationNotificationService {
  private readonly logger = new Logger(ListingExpirationNotificationService.name);

  async notifySellerListingsExpired(
    input: ListingExpiredNotificationInput,
  ): Promise<{
    success: boolean;
    channel: 'in_app';
  }> {
    // Mock notify cho UC56. TODO: ket noi notification-service endpoint thuc te.
    this.logger.log(
      `UC56 notify seller=${input.sellerUserId} listings=${input.listingIds.join(',')}`,
    );

    return {
      success: true,
      channel: 'in_app',
    };
  }
}
