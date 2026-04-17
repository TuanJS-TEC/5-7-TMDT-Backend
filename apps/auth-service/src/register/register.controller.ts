import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterInitDto } from './dto/register-init.dto';
import { RegisterResendDto } from './dto/register-resend.dto';
import { RegisterCompleteDto } from './dto/register-complete.dto';

@Controller({ path: 'auth/register', version: '1' })
export class RegisterController {
  constructor(private readonly register: RegisterService) {}

  /** UC11: bước 3–10 — lưu pending + gửi OTP */
  @Post('init')
  @HttpCode(200)
  init(@Body() dto: RegisterInitDto) {
    return this.register.init(dto);
  }

  /** UC A3: gửi lại OTP (OTP cũ bị thay thế khi gửi mới) */
  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: RegisterResendDto) {
    return this.register.resendOtp(dto.phone);
  }

  /** UC11: bước 15–18 — xác thực OTP + tạo user + JWT */
  @Post('complete')
  @HttpCode(201)
  complete(@Body() dto: RegisterCompleteDto) {
    return this.register.complete(dto.phone, dto.code);
  }
}
