import { IsUUID } from 'class-validator';

export class UploadListingImageBodyDto {
  @IsUUID()
  sellerId!: string;
}
