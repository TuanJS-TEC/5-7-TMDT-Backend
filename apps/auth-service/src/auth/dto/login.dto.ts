import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { normalizeVnPhone, VN_PHONE_REGEX } from '../phone.util';

export class LoginDto {
  @Transform(({ value }) => normalizeVnPhone(value))
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(VN_PHONE_REGEX, {
    message: 'Số điện thoại không đúng định dạng',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password!: string;
}
