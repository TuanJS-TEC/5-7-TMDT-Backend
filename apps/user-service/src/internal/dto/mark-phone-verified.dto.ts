import { IsString, Matches } from 'class-validator';

export class MarkPhoneVerifiedDto {
  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/)
  phone!: string;
}
