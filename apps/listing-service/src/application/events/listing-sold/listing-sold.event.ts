import { BaseIntegrationEvent } from '@car-marketplace/common';

export class ListingSoldEvent extends BaseIntegrationEvent {
  readonly eventName = 'listing.sold';

  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
  ) {
    super();
  }
}