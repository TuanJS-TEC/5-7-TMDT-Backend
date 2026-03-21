import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ListingApprovedEvent } from './listing-approved.event';
import { RabbitMqPublisher } from '../../../infrastructure/messaging/rabbitmq.publisher';
import { LISTING_EVENTS } from '@car-marketplace/messaging';

@EventsHandler(ListingApprovedEvent)
export class ListingApprovedHandler
  implements IEventHandler<ListingApprovedEvent>
{
  private readonly logger = new Logger(ListingApprovedHandler.name);

  constructor(private readonly publisher: RabbitMqPublisher) {}

  async handle(event: ListingApprovedEvent): Promise<void> {
    await this.publisher.publish(LISTING_EVENTS.APPROVED, {
      listingId: event.listingId,
      moderatorId: event.moderatorId,
      approvedAt: event.approvedAt.toISOString(),
    });
    this.logger.log(`Listing approved: ${event.listingId}`);
  }
}
