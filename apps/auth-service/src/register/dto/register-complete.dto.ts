import { IsString, Length, Matches } from 'class-validator';

export class RegisterCompleteDto {
  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/)
  phone!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/)
  code!: string;
}
