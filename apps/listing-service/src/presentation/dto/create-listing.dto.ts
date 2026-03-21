import { IsInt, IsString, IsUUID, MaxLength, Min } from 'class-validator';

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
}
