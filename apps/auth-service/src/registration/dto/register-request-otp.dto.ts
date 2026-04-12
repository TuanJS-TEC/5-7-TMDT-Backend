import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeVnPhone, VN_PHONE_REGEX } from '../../auth/phone.util';

/** Ít nhất 8 ký tự, có chữ và số (UC11 bước 2) */
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-zÀ-ỹ])(?=.*\d).{8,128}$/;

export class RegisterRequestOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  @MaxLength(200, { message: 'Họ tên quá dài' })
  fullName!: string;

  @Transform(({ value }) => normalizeVnPhone(value))
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(VN_PHONE_REGEX, {
    message: 'Số điện thoại không đúng định dạng',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu quá dài' })
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message:
      'Mật khẩu phải gồm ít nhất 8 ký tự và có cả chữ cái và chữ số',
  })
  password!: string;

  @IsString()
  @IsIn(['personal', 'showroom'], {
    message: 'Loại tài khoản phải là personal hoặc showroom',
  })
  accountType!: 'personal' | 'showroom';
}
