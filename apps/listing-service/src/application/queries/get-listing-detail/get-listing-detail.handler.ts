import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingDetailQuery } from './get-listing-detail.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

@QueryHandler(GetListingDetailQuery)
export class GetListingDetailHandler
  implements IQueryHandler<GetListingDetailQuery, ListingResponseDto | null>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetListingDetailQuery): Promise<ListingResponseDto | null> {
    return this.readRepo.findById(query.id);
  }
}
