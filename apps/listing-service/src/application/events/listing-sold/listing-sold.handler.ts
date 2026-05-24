import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LISTING_EVENTS, type ListingSoldPayload } from '@car-marketplace/messaging';
import { ListingSoldEvent } from './listing-sold.event';
import { RabbitMqPublisher } from '../../../infrastructure/messaging/rabbitmq.publisher';
import { FavoriteReadRepository } from '../../../infrastructure/persistence/read/favorite.read.repository';

@EventsHandler(ListingSoldEvent)
export class ListingSoldEventHandler implements IEventHandler<ListingSoldEvent> {
  private readonly logger = new Logger(ListingSoldEventHandler.name);

  constructor(
    private readonly publisher: RabbitMqPublisher,
    private readonly favoriteReadRepo: FavoriteReadRepository,
    private readonly config: ConfigService,
  ) {}

  private parseAdminUserIds(): string[] {
    const raw = this.config.get<string>('NOTIFICATION_ADMIN_USER_IDS')?.trim();
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async handle(event: ListingSoldEvent): Promise<void> {
    const favoriteUserIds =
      await this.favoriteReadRepo.getUserIdsByListingId(event.listingId);
    const adminUserIds = this.parseAdminUserIds();

    const payload: ListingSoldPayload = {
      listingId: event.listingId,
      sellerId: event.sellerId,
      title: event.title,
      soldAt: event.soldAt.toISOString(),
      favoriteUserIds,
      adminUserIds,
    };

    await this.publisher.publish(LISTING_EVENTS.SOLD, payload);
    this.logger.log(
      `listing.sold ${event.listingId} — notify ${favoriteUserIds.length} favorites, ${adminUserIds.length} admins`,
    );
  }
}
