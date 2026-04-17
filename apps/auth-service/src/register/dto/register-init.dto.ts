import { IsEnum, IsString, Length, Matches, MinLength } from 'class-validator';
import { AccountType } from '../account-type.enum';

export class RegisterInitDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/, { message: 'phone_invalid_format' })
  phone!: string;

  /** Tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số (A4) */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-zÀ-ỹ])(?=.*\d).{8,128}$/, {
    message: 'password_weak',
  })
  password!: string;

  @IsEnum(AccountType)
  accountType!: AccountType;
}
