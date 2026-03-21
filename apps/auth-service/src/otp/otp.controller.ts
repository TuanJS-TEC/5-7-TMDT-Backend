import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  /** UC: Gửi OTP (bước 1–3) */
  @Post('send')
  send(@Body() dto: SendOtpDto) {
    return this.otp.sendOtp(dto.phone, dto.purpose);
  }

  /** UC: Xác thực OTP (bước 4–7) */
  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.otp.verifyOtp(dto.phone, dto.code);
  }
}
