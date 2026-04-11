import { IEvent } from '@nestjs/cqrs';

/** UC33 — quản trị viên yêu cầu seller chỉnh sửa tin */
export class ListingModificationRequestedEvent implements IEvent {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string,
    public readonly moderatorId: string,
    public readonly details: string,
    public readonly requestedAt: Date,
  ) {}
}
