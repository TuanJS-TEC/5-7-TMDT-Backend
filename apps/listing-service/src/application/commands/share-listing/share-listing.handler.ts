import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShareListingCommand } from './share-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { isPubliclyVisible } from '../../../domain/listing-status.rules';

@CommandHandler(ShareListingCommand)
export class ShareListingHandler implements ICommandHandler<ShareListingCommand> {
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly readRepo: ListingReadRepository,
  ) {}

  async execute(command: ShareListingCommand): Promise<string> {
    const listing = await this.readRepo.findById(command.listingId);
    if (!listing || !isPubliclyVisible(listing.status, listing.expiresAt)) {
      throw new BadRequestException(
        'Chi chia se tin dang hien thi cong khai (approved, chua het han).',
      );
    }

    const success = await this.writeRepo.incrementShareCount(command.listingId);
    
    if (!success) {
      throw new NotFoundException(`Listing with ID ${command.listingId} not found`);
    }

    // Ở đây có thể tạo ra URL chia sẻ thực tế dựa trên FE domain.
    // Ví dụ: https://carmarket.vn/listings/123
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/listings/${command.listingId}`;
    // const shareUrl 
    
    return shareUrl;
  }
}
