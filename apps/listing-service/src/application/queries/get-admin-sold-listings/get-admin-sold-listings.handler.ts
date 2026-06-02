import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAdminSoldListingsQuery } from './get-admin-sold-listings.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

export interface AdminSoldListingsResult {
  items: ListingResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@QueryHandler(GetAdminSoldListingsQuery)
export class GetAdminSoldListingsHandler
  implements IQueryHandler<GetAdminSoldListingsQuery, AdminSoldListingsResult>
{
  constructor(private readonly readRepo: ListingReadRepository) {}

  async execute(query: GetAdminSoldListingsQuery): Promise<AdminSoldListingsResult> {
    return this.readRepo.findMany(
      query.page,
      query.limit,
      'sold',
      'updatedAt',
      'desc',
    );
  }
}
