import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DeleteListingCommand } from './delete-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ListingDeletedEvent } from '../../events/listing-deleted/listing-deleted.event';

@CommandHandler(DeleteListingCommand)
// export class DeleteListingHandler
//   implements ICommandHandler<DeleteListingCommand>
// {
//   constructor(private readonly writeRepo: ListingWriteRepository) {}

//   async execute(command: DeleteListingCommand): Promise<void> {
//     const existing = await this.writeRepo.findById(command.id);
//     if (!existing) {
//       throw new BadRequestException('Listing not found');
//     }
//     if (existing.sellerId !== command.sellerId) {
//       throw new ForbiddenException();
//     }
//     await this.writeRepo.delete(command.id);
//   }
// }
export class DeleteListingHandler implements ICommandHandler<DeleteListingCommand> {
  constructor(
    private readonly listingWriteRepository: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteListingCommand): Promise<void> {
    const listing = await this.listingWriteRepository.findById(command.id);

    if (!listing) {
      throw new NotFoundException('Tin đăng không tồn tại.');
    }
    if (listing.sellerId !== command.sellerId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin đăng này.');
    }
    // Thực hiện soft delete
    await this.listingWriteRepository.update(command.id, { isDeleted: true, status: 'removed' });

    // Publish event ListingDeletedEvent để Notification Service thông báo cho người mua đã lưu
    this.eventBus.publish(new ListingDeletedEvent(command.id, listing.sellerId));
  }
}
