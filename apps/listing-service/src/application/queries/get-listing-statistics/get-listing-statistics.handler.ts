import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetListingStatisticsQuery } from './get-listing-statistics.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';

@QueryHandler(GetListingStatisticsQuery)
export class GetListingStatisticsHandler implements IQueryHandler<GetListingStatisticsQuery> {
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetListingStatisticsQuery): Promise<any> {
    const listing = await this.readRepo.findById(query.listingId);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${query.listingId} not found`);
    }

    return {
      listingId: listing.id,
      viewCount: listing.viewCount || 0,
      shareCount: listing.shareCount || 0,
      favoriteCount: listing.favoriteCount || 0,
      contactCount: listing.contactCount || 0,
    };
  }
}
