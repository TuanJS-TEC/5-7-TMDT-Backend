import { IsString, Matches } from 'class-validator';

export class RegisterResendDto {
  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/)
  phone!: string;
}
