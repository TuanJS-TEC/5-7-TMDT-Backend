import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class InternalLockAccountDto {
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
