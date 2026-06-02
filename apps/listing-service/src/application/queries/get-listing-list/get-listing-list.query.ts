import type { ListingStatus } from '../../../domain/entities/listing.entity';
export class GetListingListQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    // public readonly status?: string,
    public readonly status?: ListingStatus | string,
    public readonly sortBy?: string, // Dùng string để flexible với các trường sắp xếp
    public readonly sortOrder?: 'asc' | 'desc',
    public readonly search?: string,
    public readonly make?: string,
    public readonly fuelType?: string,
    public readonly transmission?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
  ) {}
}
