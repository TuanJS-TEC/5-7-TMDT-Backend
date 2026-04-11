import type { ListingPackageType } from '../../../domain/entities/listing.entity';

export class CreateListingCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly priceVnd: number,
    public readonly sellerId: string,
    /** UC16 bước 3 — gói tin người bán chọn */
    public readonly packageType: ListingPackageType,
    /** UC16 bước 5 — mảng URL ảnh xe */
    public readonly imageUrls: string[],
    /** Hãng xe */
    public readonly carMake: string,
    /** Dòng xe */
    public readonly carModel: string,
    /** Năm sản xuất */
    public readonly carYear: number,
    /** Số km đã đi */
    public readonly mileageKm: number,
    /** Loại nhiên liệu */
    public readonly fuelType: string,
    /** Hộp số */
    public readonly transmission: string,
  ) {}
}
