import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FilterListingsQuery } from './filter-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingListResult } from '../get-listing-list/get-listing-list.handler';

@QueryHandler(FilterListingsQuery)
export class FilterListingsHandler
  implements IQueryHandler<FilterListingsQuery, ListingListResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: FilterListingsQuery): Promise<ListingListResult> {
    return this.readRepo.filter(
      query.minPrice,
      query.maxPrice,
      query.carMake,
      query.carModel,
      query.minYear,
      query.maxYear,
      query.fuelType,
      query.transmission,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }
}