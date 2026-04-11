import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CompareListingsQuery } from './compare-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

@QueryHandler(CompareListingsQuery)
export class CompareListingsHandler
  implements IQueryHandler<CompareListingsQuery, ListingResponseDto[]>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: CompareListingsQuery): Promise<ListingResponseDto[]> {
    return this.readRepo.findByIds(query.ids);
  }
}
