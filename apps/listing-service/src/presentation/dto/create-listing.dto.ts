import {
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingPackageType } from '../../domain/entities/listing.entity';
import type { FuelType, TransmissionType } from '../../domain/entities/listing.entity';


export class CreateListingDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(8000)
  description!: string;

  @IsInt()
  @Min(0)
  priceVnd!: number;

  @IsUUID()
  sellerId!: string;

  /** UC16 bước 3 — gói tin: basic | premium | vip */
  // @IsEnum(['basic', 'premium', 'vip'])
  // packageType!: 'basic' | 'premium' | 'vip';
  @IsEnum(ListingPackageType)
  packageType!: ListingPackageType;

  /**
   * UC16 bước 5 — danh sách URL ảnh xe (tối thiểu 1, tối đa 20).
   * Client tự upload ảnh lên CDN trước rồi gửi URL vào đây.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  imageUrls!: string[];

  /** Hãng xe, ví dụ: Toyota, Honda, Ford */
  @IsString()
  @MaxLength(100)
  carMake!: string;

  /** Dòng xe, ví dụ: Camry, City, Ranger */
  @IsString()
  @MaxLength(100)
  carModel!: string;

  /** Năm sản xuất (1886 – năm hiện tại + 1) */
  @IsInt()
  @Min(1886)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  carYear!: number;

  /** Số km đã đi */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  mileageKm!: number;

  /** Loại nhiên liệu */
  @IsEnum(['petrol', 'diesel', 'electric', 'hybrid', 'other'])
  fuelType!: FuelType;

  /** Hộp số */
  @IsEnum(['automatic', 'manual', 'semi-automatic'])
  transmission!: TransmissionType;

  /**
   * Mã người bán — optional field nếu controller muốn
   * override từ JWT, để thuận tiện cho test không có JWT.
   */
  @IsOptional()
  @IsUUID()
  _sellerId?: string;
}
