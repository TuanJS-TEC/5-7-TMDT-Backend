import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class ManualImageReviewDto {
  @IsUUID()
  moderatorId!: string;

  /** true = chấp nhận ảnh chờ; false = từ chối ảnh */
  @IsBoolean()
  approve!: boolean;

  /** Khi approve=false: có thể bác bỏ cả bài đăng */
  @IsOptional()
  @IsBoolean()
  rejectListing?: boolean;
}
