import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMyListingsQuery } from './get-my-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

export interface MyListingsResult {
  items: ListingResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@QueryHandler(GetMyListingsQuery)
export class GetMyListingsHandler
  implements IQueryHandler<GetMyListingsQuery, MyListingsResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetMyListingsQuery): Promise<MyListingsResult> {
    return this.readRepo.findBySellerOwner(
      query.sellerId,
      query.page,
      query.limit,
    );
  }
}
