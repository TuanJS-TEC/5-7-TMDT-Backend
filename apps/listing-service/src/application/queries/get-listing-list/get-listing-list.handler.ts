import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingListQuery } from './get-listing-list.query';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';
import type { ListingStatus } from '../../../domain/entities/listing.entity';

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
    // return this.readRepo.findMany(query.page, query.limit, query.status);
    // Dev — API công khai chỉ trả tin đang hiển thị trên sàn (approved, chưa hết hạn).
    const publicStatus: ListingStatus = 'approved';

    return this.readRepo.findMany(
      query.page,
      query.limit,
      publicStatus,
      query.sortBy,
      query.sortOrder,
      query.search,
      query.make,
      query.fuelType,
      query.transmission,
      query.minPrice,
      query.maxPrice,
    );
  }
}
