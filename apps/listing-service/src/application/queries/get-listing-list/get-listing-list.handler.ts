import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingListQuery } from './get-listing-list.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

export interface ListingListResult {
  items: ListingResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@QueryHandler(GetListingListQuery)
export class GetListingListHandler
  implements IQueryHandler<GetListingListQuery, ListingListResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetListingListQuery): Promise<ListingListResult> {
    return this.readRepo.findMany(query.page, query.limit, query.status);
  }
}
