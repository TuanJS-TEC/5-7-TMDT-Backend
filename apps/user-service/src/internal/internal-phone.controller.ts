import {
  Body,
  Controller,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InternalSecretGuard } from './internal-secret.guard';
import { MarkPhoneVerifiedDto } from './dto/mark-phone-verified.dto';
import { normalizeVietnamPhone } from '../users/phone.util';

interface PhoneMarker {
  markPhoneVerifiedByPhone(phone: string): Promise<'updated' | 'none'>;
}

@Controller({ path: 'internal/phone', version: VERSION_NEUTRAL })
export class InternalPhoneController {
  constructor(
    @Inject('PHONE_MARKER') private readonly marker: PhoneMarker,
  ) {}

  /** Gọi nội bộ từ auth-service sau khi OTP đúng */
  @Post('mark-verified')
  @UseGuards(InternalSecretGuard)
  async markVerified(@Body() dto: MarkPhoneVerifiedDto) {
    const phone = normalizeVietnamPhone(dto.phone);
    const r = await this.marker.markPhoneVerifiedByPhone(phone);
    return {
      status: r === 'updated' ? 'ok' : 'no_user',
    };
  }
}
