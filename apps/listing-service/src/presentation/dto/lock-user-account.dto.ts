import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** UC37 — khóa tài khoản từ màn quản lý người dùng (không qua báo cáo UC35). */
export class LockUserAccountDto {
  @IsUUID()
  moderatorId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsDateString()
  lockUntil?: string;
}
