import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ListingRejectedEvent } from './listing-rejected.event';
import { RabbitMqPublisher } from '../../../infrastructure/messaging/rabbitmq.publisher';
import { LISTING_EVENTS } from '@car-marketplace/messaging';

@EventsHandler(ListingRejectedEvent)
export class ListingRejectedHandler
  implements IEventHandler<ListingRejectedEvent>
{
  private readonly logger = new Logger(ListingRejectedHandler.name);

  constructor(private readonly publisher: RabbitMqPublisher) {}

  async handle(event: ListingRejectedEvent): Promise<void> {
    await this.publisher.publish(LISTING_EVENTS.REJECTED, {
      listingId: event.listingId,
      sellerId: event.sellerId,
      moderatorId: event.moderatorId,
      reason: event.reason,
      rejectedAt: event.rejectedAt.toISOString(),
    });
    this.logger.log(
      `Listing rejected: ${event.listingId} — reason: ${event.reason}`,
    );
  }
}
