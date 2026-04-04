import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-zÀ-ỹ])(?=.*\d).{8,128}$/;

export class PasswordResetCompleteDto {
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống' })
  passwordResetToken!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu quá dài' })
  @Matches(PASSWORD_STRENGTH_REGEX, {
    message:
      'Mật khẩu phải gồm ít nhất 8 ký tự và có cả chữ cái và chữ số',
  })
  newPassword!: string;
}
