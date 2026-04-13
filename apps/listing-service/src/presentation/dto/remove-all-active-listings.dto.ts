import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** UC38 — lệnh gỡ hàng loạt tin active từ màn quản trị (không qua báo cáo UC35). */
export class RemoveAllActiveListingsDto {
  @IsUUID()
  moderatorId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note?: string;
}
