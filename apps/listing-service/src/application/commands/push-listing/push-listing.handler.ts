import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { isPubliclyVisible } from '../../../domain/listing-status.rules';
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
    if (!isPubliclyVisible(listing.status, listing.expiresAt)) {
      throw new BadRequestException(
        'Chi day tin khi dang hien thi cong khai (approved, chua het han).',
      );
    }

    const pushTime = new Date();
    await this.writeRepo.updatePushedAt(command.listingId, pushTime);
    return pushTime;
  }
}
