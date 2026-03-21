import { IEvent } from '@nestjs/cqrs';

export class ListingCreatedEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly title: string,
    public readonly occurredAt: Date,
  ) {}
}
