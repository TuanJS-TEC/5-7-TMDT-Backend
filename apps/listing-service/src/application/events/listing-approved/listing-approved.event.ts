import { IEvent } from '@nestjs/cqrs';

export class ListingApprovedEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly moderatorId: string,
    public readonly approvedAt: Date,
  ) {}
}
