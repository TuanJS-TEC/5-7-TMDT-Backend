import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ShareListingCommand } from './share-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';

@CommandHandler(ShareListingCommand)
export class ShareListingHandler implements ICommandHandler<ShareListingCommand> {
  constructor(private readonly writeRepo: ListingWriteRepository) {}

  async execute(command: ShareListingCommand): Promise<string> {
    const success = await this.writeRepo.incrementShareCount(command.listingId);
    
    if (!success) {
      throw new NotFoundException(`Listing with ID ${command.listingId} not found`);
    }

    // Ở đây có thể tạo ra URL chia sẻ thực tế dựa trên FE domain.
    // Ví dụ: https://carmarket.vn/listings/123
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/listings/${command.listingId}`;
    
    return shareUrl;
  }
}
