import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { LISTING_EVENTS } from '@car-marketplace/messaging';
import { RabbitMqPublisher } from '../../../infrastructure/messaging/rabbitmq.publisher';
import { ListingModificationRequestedEvent } from './listing-modification-requested.event';

@EventsHandler(ListingModificationRequestedEvent)
export class ListingModificationRequestedHandler
  implements IEventHandler<ListingModificationRequestedEvent>
{
  private readonly logger = new Logger(ListingModificationRequestedHandler.name);

  constructor(private readonly publisher: RabbitMqPublisher) {}

  async handle(event: ListingModificationRequestedEvent): Promise<void> {
    await this.publisher.publish(LISTING_EVENTS.MODIFICATION_REQUESTED, {
      listingId: event.listingId,
      sellerId: event.sellerId,
      moderatorId: event.moderatorId,
      details: event.details,
      requestedAt: event.requestedAt.toISOString(),
    });

    this.logger.log(`Listing modification requested: ${event.listingId}`);
  }
}
