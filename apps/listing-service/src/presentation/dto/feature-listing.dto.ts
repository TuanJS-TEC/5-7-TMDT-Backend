import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureListingDto {
  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  days: number;
}
