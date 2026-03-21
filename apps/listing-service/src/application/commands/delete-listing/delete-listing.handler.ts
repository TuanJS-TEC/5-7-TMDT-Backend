import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DeleteListingCommand } from './delete-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';

@CommandHandler(DeleteListingCommand)
export class DeleteListingHandler
  implements ICommandHandler<DeleteListingCommand>
{
  constructor(private readonly writeRepo: ListingWriteRepository) {}

  async execute(command: DeleteListingCommand): Promise<void> {
    const existing = await this.writeRepo.findById(command.id);
    if (!existing) {
      throw new BadRequestException('Listing not found');
    }
    if (existing.sellerId !== command.sellerId) {
      throw new ForbiddenException();
    }
    await this.writeRepo.delete(command.id);
  }
}
