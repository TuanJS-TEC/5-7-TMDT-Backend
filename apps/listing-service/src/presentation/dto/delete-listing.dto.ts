import { IsUUID } from 'class-validator';

export class DeleteListingDto {
  @IsUUID()
  sellerId!: string;
}
