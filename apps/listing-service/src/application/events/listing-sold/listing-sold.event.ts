import { IEvent } from '@nestjs/cqrs';

export class ListingSoldEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly title: string,
    public readonly soldAt: Date,
  ) {}
}
