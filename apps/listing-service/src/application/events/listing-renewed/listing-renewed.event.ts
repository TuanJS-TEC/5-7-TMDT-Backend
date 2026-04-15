import { BaseIntegrationEvent } from '@car-marketplace/common';
import type { ListingPackageType } from '../../../domain/entities/listing.entity';

export class ListingRenewedEvent extends BaseIntegrationEvent {
  readonly eventName = 'listing.renewed';

  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly newPackageType: ListingPackageType,
    public readonly newExpiresAt: Date,
  ) {
    super();
  }
}