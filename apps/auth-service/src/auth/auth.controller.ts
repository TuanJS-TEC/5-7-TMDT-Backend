import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginDto } from './dto/login.dto';
import { RegisterService } from '../registration/register.service';
import { RegisterRequestOtpDto } from '../registration/dto/register-request-otp.dto';
import { RegisterVerifyOtpDto } from '../registration/dto/register-verify-otp.dto';
import { RegisterResendOtpDto } from '../registration/dto/register-resend-otp.dto';
import { SendPhoneOtpDto } from '../otp/dto/send-phone-otp.dto';
import { VerifyPhoneOtpDto } from '../otp/dto/verify-phone-otp.dto';
import { PhoneOtpFacadeService } from '../otp/phone-otp.facade.service';
import { PasswordResetService } from '../password-reset/password-reset.service';
import { PasswordResetCompleteDto } from '../password-reset/dto/password-reset-complete.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenService } from './refresh-token.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly registerService: RegisterService,
    private readonly phoneOtpFacade: PhoneOtpFacadeService,
    private readonly passwordReset: PasswordResetService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.loginService.login(dto, userAgent ?? '');
  }

  /** UC11 bước 2–4: kiểm tra dữ liệu, SĐT trùng, gửi OTP 120s */
  @Post('register/request-otp')
  @HttpCode(200)
  registerRequestOtp(@Body() dto: RegisterRequestOtpDto) {
    return this.registerService.requestOtp(dto);
  }

  /** UC11 A3: gửi lại OTP, vô hiệu mã cũ */
  @Post('register/resend-otp')
  @HttpCode(200)
  registerResendOtp(@Body() dto: RegisterResendOtpDto) {
    return this.registerService.resendOtp(dto.phone);
  }

  /** UC11 bước 6–9: xác thực OTP, tạo user, 3 tin FREE (showroom), JWT */
  @Post('register/verify-otp')
  @HttpCode(200)
  registerVerifyOtp(
    @Body() dto: RegisterVerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.registerService.verifyOtpAndCreateUser(
      dto.phone,
      dto.code,
      userAgent ?? '',
    );
  }

  /** UC12: gửi OTP (đặt lại mật khẩu / xác thực SĐT tài khoản đã tồn tại) */
  @Post('otp/send')
  @HttpCode(200)
  sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.phoneOtpFacade.sendPublicOtp(dto.phone, dto.purpose);
  }

  /** UC12: xác thực OTP — phone_verify cập nhật DB; password_reset trả token đổi MK */
  @Post('otp/verify')
  @HttpCode(200)
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.phoneOtpFacade.verifyPublicOtp(
      dto.phone,
      dto.purpose,
      dto.code,
    );
  }

  @Post('password-reset/complete')
  @HttpCode(200)
  passwordResetComplete(@Body() dto: PasswordResetCompleteDto) {
    return this.passwordReset.complete(
      dto.passwordResetToken,
      dto.newPassword,
    );
  }

  /** Mobile — đổi access token bằng refresh token */
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.refreshTokens.refreshSession(dto.refreshToken, userAgent ?? '');
  }
}
