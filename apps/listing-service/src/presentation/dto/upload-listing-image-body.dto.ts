import { IsOptional, IsUUID } from 'class-validator';

/** Multipart: field `file` bắt buộc; sellerId lấy từ JWT (field này optional). */
export class UploadListingImageBodyDto {
  @IsOptional()
  @IsUUID()
  sellerId?: string;
}
