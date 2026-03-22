import { IsString, Matches } from 'class-validator';

export class PhoneExistsDto {
  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/)
  phone!: string;
}
