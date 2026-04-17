import type { ListingPackageType } from '../../../domain/entities/listing.entity';

export class RenewListingCommand {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string, // Để xác thực người bán
    public readonly newPackageType: ListingPackageType, // Gói mới
    public readonly paymentOrderId: string, // ID đơn thanh toán thành công
  ) {}
}