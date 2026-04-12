import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SellerWarningRequestDto {
  @IsUUID()
  recipientUserId!: string;

  @IsOptional()
  @IsUUID()
  reportId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  warningType?: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(4000)
  body!: string;
}
