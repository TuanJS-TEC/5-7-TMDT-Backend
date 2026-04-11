import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UpdateListingCommand } from './update-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';

@CommandHandler(UpdateListingCommand)
export class UpdateListingHandler
  implements ICommandHandler<UpdateListingCommand>
{
  constructor(private readonly writeRepo: ListingWriteRepository) {}

  async execute(command: UpdateListingCommand): Promise<void> {
    const existing = await this.writeRepo.findById(command.id);
    if (!existing) {
      throw new BadRequestException('Listing not found');
    }
    if (existing.sellerId !== command.sellerId) {
      throw new ForbiddenException();
    }

    if (existing.status === 'sold') {
      throw new BadRequestException('Sold listing cannot be edited');
    }

    const shouldResubmitForModeration =
      existing.status === 'approved' || existing.status === 'rejected';

    await this.writeRepo.update(command.id, {
      title: command.title ?? existing.title,
      description: command.description ?? existing.description,
      priceVnd: command.priceVnd ?? existing.priceVnd,
      status: shouldResubmitForModeration ? 'pending' : existing.status,
      approvedAt: shouldResubmitForModeration ? undefined : existing.approvedAt,
      rejectionReason: shouldResubmitForModeration
        ? undefined
        : existing.rejectionReason,
    });
  }
}
