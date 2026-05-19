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
    const defaultStatus: ListingStatus = 'approved'; // Mặc định hiển thị tin đã duyệt

    // Gọi findMany từ repository, truyền thêm sortBy và sortOrder
    return this.readRepo.findMany(
      query.page,
      query.limit,
      query.status ?? defaultStatus, // Nếu không có status, dùng default
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
