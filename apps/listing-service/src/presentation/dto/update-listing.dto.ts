import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateListingDto {
  @IsUUID()
  sellerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceVnd?: number;
}
