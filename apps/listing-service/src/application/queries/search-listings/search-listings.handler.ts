import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchListingsQuery } from './search-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingListResult } from '../get-listing-list/get-listing-list.handler'; 

@QueryHandler(SearchListingsQuery)
export class SearchListingsHandler
  implements IQueryHandler<SearchListingsQuery, ListingListResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: SearchListingsQuery): Promise<ListingListResult> {
    // Để mock test, logic tìm kiếm sẽ được thực hiện trực tiếp trong repository
    // Trong thực tế, đây sẽ là nơi gọi Search Service (Elasticsearch)
    return this.readRepo.search(
      query.keyword,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }
}