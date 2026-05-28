import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** UC33 — HTTP nội bộ gửi thông báo yêu cầu chỉnh sửa tin */
export class ListingModificationRequestedRequestDto {
  @IsUUID()
  recipientUserId!: string;

  @IsUUID()
  listingId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  details!: string;

  @IsOptional()
  @IsString()
  requestedAt?: string;
}
