import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** UC33 — QTV yêu cầu seller chỉnh sửa tin đăng */
export class RequestModificationDto {
  @IsUUID()
  moderatorId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  details!: string;
}
