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
    await this.writeRepo.update(command.id, {
      title: command.title ?? existing.title,
      description: command.description ?? existing.description,
      priceVnd: command.priceVnd ?? existing.priceVnd,
    });
  }
}
