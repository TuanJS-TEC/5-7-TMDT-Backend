import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingStatsQuery } from './get-listing-stats.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';

@QueryHandler(GetListingStatsQuery)
export class GetListingStatsHandler implements IQueryHandler<GetListingStatsQuery> {
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(_query: GetListingStatsQuery) {
    return this.readRepo.getStats();
  }
}
