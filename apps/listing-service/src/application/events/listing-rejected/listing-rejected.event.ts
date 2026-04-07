import { IEvent } from '@nestjs/cqrs';

/** UC16 A1 — bài đăng bị admin từ chối */
export class ListingRejectedEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly moderatorId: string,
    public readonly reason: string,
    public readonly rejectedAt: Date,
  ) {}
}
