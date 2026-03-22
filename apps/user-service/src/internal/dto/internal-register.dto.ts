import { IsEnum, IsString, Length, Matches, MinLength } from 'class-validator';
import { AccountType } from '../../users/account-type.enum';

export class InternalRegisterDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/)
  phone!: string;

  @IsString()
  @MinLength(60)
  passwordHash!: string;

  @IsEnum(AccountType)
  accountType!: AccountType;
}
