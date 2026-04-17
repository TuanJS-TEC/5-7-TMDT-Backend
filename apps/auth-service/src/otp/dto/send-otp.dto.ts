import { IsEnum, IsString, Matches } from 'class-validator';

export enum OtpPurpose {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
  VERIFY_PHONE = 'verify_phone',
}

export class SendOtpDto {
  /** SĐT (VD: 0912345678 hoặc +84912345678) */
  @IsString()
  @Matches(/^[\d\s+()-]{10,20}$/, {
    message: 'phone_invalid_format',
  })
  phone!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
