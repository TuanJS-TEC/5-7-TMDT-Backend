import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ListingPackageType } from '../../domain/entities/listing.entity';

export class RenewListingDto {
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;

  @IsEnum(ListingPackageType)
  @IsNotEmpty()
  newPackageType!: ListingPackageType;

  @IsUUID()
  @IsNotEmpty()
  paymentOrderId!: string; // ID của đơn thanh toán thành công từ Payment Service
}