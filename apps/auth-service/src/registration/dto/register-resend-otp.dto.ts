import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { normalizeVnPhone, VN_PHONE_REGEX } from '../../auth/phone.util';

export class RegisterResendOtpDto {
  @Transform(({ value }) => normalizeVnPhone(value))
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(VN_PHONE_REGEX, {
    message: 'Số điện thoại không đúng định dạng',
  })
  phone!: string;
}
