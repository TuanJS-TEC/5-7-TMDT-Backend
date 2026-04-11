import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ListingCreatedEvent } from './listing-created.event';
import { RabbitMqPublisher } from '../../../infrastructure/messaging/rabbitmq.publisher';
import { LISTING_EVENTS } from '@car-marketplace/messaging';

@EventsHandler(ListingCreatedEvent)
export class ListingCreatedHandler
  implements IEventHandler<ListingCreatedEvent>
{
  private readonly logger = new Logger(ListingCreatedHandler.name);

  constructor(private readonly publisher: RabbitMqPublisher) {}

  async handle(event: ListingCreatedEvent): Promise<void> {
    await this.publisher.publish(LISTING_EVENTS.CREATED, {
      listingId: event.listingId,
      sellerId: event.sellerId,
      title: event.title,
      packageType: event.packageType,
      occurredAt: event.occurredAt.toISOString(),
    });
    this.logger.log(`Listing created: ${event.listingId}`);
  }
}
