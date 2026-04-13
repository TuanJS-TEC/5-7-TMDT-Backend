import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { FeatureListingCommand } from './feature-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';

@CommandHandler(FeatureListingCommand)
export class FeatureListingHandler implements ICommandHandler<FeatureListingCommand> {
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly readRepo: ListingReadRepository,
  ) {}

  async execute(command: FeatureListingCommand): Promise<Date> {
    const listing = await this.readRepo.findById(command.listingId);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${command.listingId} not found`);
    }

    await this.writeRepo.featureListing(command.listingId, command.days);
    
    // Calculate returning date manually or read from repo. We know the math:
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + command.days);
    
    return featuredUntil;
  }
}
