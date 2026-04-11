import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** UC16 A1 — Admin từ chối / huỷ bài đăng */
export class RejectListingDto {
  @IsUUID()
  moderatorId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
