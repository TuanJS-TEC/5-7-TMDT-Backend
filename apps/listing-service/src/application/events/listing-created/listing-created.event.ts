import { IEvent } from '@nestjs/cqrs';
import type { ListingPackageType } from '../../../domain/entities/listing.entity';

export class ListingCreatedEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly title: string,
    /** UC16 — gói tin đã chọn */
    public readonly packageType: ListingPackageType,
    public readonly occurredAt: Date,
  ) {}
}
