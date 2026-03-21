import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSellerListingsQuery } from './get-seller-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

export interface SellerListingsResult {
  items: ListingResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@QueryHandler(GetSellerListingsQuery)
export class GetSellerListingsHandler
  implements IQueryHandler<GetSellerListingsQuery, SellerListingsResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetSellerListingsQuery): Promise<SellerListingsResult> {
    return this.readRepo.findBySeller(
      query.sellerId,
      query.page,
      query.limit,
    );
  }
}
