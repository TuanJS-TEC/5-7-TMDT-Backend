import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AccountLockedRequestDto {
  @IsUUID()
  recipientUserId!: string;

  @IsOptional()
  @IsUUID()
  reportId?: string;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lockUntilIso?: string | null;
}
