import { BaseIntegrationEvent } from '@car-marketplace/common';

export class ListingDeletedEvent extends BaseIntegrationEvent {
  readonly eventName = 'listing.deleted';

  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
  ) {
    super();
  }
}