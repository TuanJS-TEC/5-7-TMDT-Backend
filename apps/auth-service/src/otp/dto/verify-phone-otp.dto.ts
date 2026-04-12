import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';
import { normalizeVnPhone, VN_PHONE_REGEX } from '../../auth/phone.util';
import type { OtpPurpose } from '../otp-challenge.orm.entity';

export class VerifyPhoneOtpDto {
  @Transform(({ value }) => normalizeVnPhone(value))
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(VN_PHONE_REGEX, {
    message: 'Số điện thoại không đúng định dạng',
  })
  phone!: string;

  @IsString()
  @IsIn(['password_reset', 'phone_verify'], {
    message: 'purpose phải là password_reset hoặc phone_verify',
  })
  purpose!: Extract<OtpPurpose, 'password_reset' | 'phone_verify'>;

  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  code!: string;
}
