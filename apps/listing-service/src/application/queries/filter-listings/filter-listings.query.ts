import type { FuelType, TransmissionType } from '../../../domain/entities/listing.entity';

export class FilterListingsQuery {
  constructor(
    public readonly minPrice: number,
    public readonly maxPrice: number,
    public readonly minYear: number,
    public readonly maxYear: number,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly carMake?: string,
    public readonly carModel?: string,
    public readonly fuelType?: FuelType | string,
    public readonly transmission?: TransmissionType | string,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
  ) {}
}