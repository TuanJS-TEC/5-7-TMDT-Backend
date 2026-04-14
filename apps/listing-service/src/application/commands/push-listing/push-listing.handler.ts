import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PushListingCommand } from './push-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';

@CommandHandler(PushListingCommand)
export class PushListingHandler implements ICommandHandler<PushListingCommand> {
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly readRepo: ListingReadRepository,
  ) {}

  async execute(command: PushListingCommand): Promise<Date> {
    const listing = await this.readRepo.findById(command.listingId);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${command.listingId} not found`);
    }

    const pushTime = new Date();
    await this.writeRepo.updatePushedAt(command.listingId, pushTime);
    return pushTime;
  }
}
