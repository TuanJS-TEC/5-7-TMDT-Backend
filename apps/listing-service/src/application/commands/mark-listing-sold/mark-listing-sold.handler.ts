import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { MarkListingSoldCommand } from './mark-listing-sold.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { isPubliclyVisible } from '../../../domain/listing-status.rules';
import { ListingSoldEvent } from '../../events/listing-sold/listing-sold.event';

@CommandHandler(MarkListingSoldCommand)
export class MarkListingSoldHandler implements ICommandHandler<MarkListingSoldCommand> {
  constructor(
    private readonly listingWriteRepository: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkListingSoldCommand): Promise<void> {
    const listing = await this.listingWriteRepository.findById(command.listingId);

    if (!listing) {
      throw new NotFoundException('Tin đăng không tồn tại.');
    }
    if (listing.sellerId !== command.sellerId) {
      throw new ForbiddenException('Bạn không có quyền đánh dấu tin đăng này đã bán.');
    }
    if (listing.status === 'sold') {
      return;
    }
    if (!isPubliclyVisible(listing.status, listing.expiresAt)) {
      throw new BadRequestException(
        'Chi danh dau da ban khi tin dang hien thi cong khai (approved, chua het han).',
      );
    }

    await this.listingWriteRepository.update(command.listingId, { status: 'sold' });

    this.eventBus.publish(
      new ListingSoldEvent(
        command.listingId,
        listing.sellerId,
        listing.title,
        new Date(),
      ),
    );
  }
}