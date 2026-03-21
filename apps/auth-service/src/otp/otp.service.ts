import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { randomInt } from 'crypto';
import type { SmsGateway } from './sms/sms-gateway.interface';
import { SMS_GATEWAY } from './sms/sms-gateway.interface';
import { OtpPurpose } from './dto/send-otp.dto';
import {
  isLikelyVietnamMobile,
  normalizeVietnamPhone,
} from './phone.util';
import { UserServiceClient } from './user-service.client';

interface OtpSession {
  code: string;
  purpose: OtpPurpose;
  attemptsLeft: number;
  expiresAtMs: number;
}

const SESSION_PREFIX = 'otp:session:';
const SMS_FAIL_PREFIX = 'otp:sms_fail:';

@Injectable()
export class OtpService {
  private readonly ttlSeconds: number;
  private readonly smsFailCooldownSeconds: number;
  private readonly verificationJwtTtl: string;
  private readonly useMemory: boolean;
  private readonly memory = new Map<string, OtpSession>();
  private readonly memorySmsFail = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    @Inject(SMS_GATEWAY) private readonly sms: SmsGateway,
    private readonly jwt: JwtService,
    private readonly userClient: UserServiceClient,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {
    this.ttlSeconds = parseInt(
      this.config.get<string>('OTP_TTL_SECONDS', '120'),
      10,
    );
    this.smsFailCooldownSeconds = parseInt(
      this.config.get<string>('OTP_SMS_FAIL_COOLDOWN_SECONDS', '30'),
      10,
    );
    this.verificationJwtTtl = this.config.get<string>(
      'PHONE_VERIFICATION_JWT_EXPIRES',
      '15m',
    );
    this.useMemory =
      this.config.get<string>('SKIP_REDIS', 'false') === 'true' ||
      !this.redis;
  }

  private sessionKey(phone: string): string {
    return `${SESSION_PREFIX}${phone}`;
  }

  private smsFailKey(phone: string): string {
    return `${SMS_FAIL_PREFIX}${phone}`;
  }

  async sendOtp(phoneRaw: string, purpose: OtpPurpose): Promise<{ sent: true }> {
    const phone = normalizeVietnamPhone(phoneRaw);
    if (!isLikelyVietnamMobile(phone)) {
      throw new BadRequestException({
        code: 'PHONE_INVALID',
        message: 'Số điện thoại không hợp lệ.',
      });
    }

    const failTtl = await this.getSmsFailTtlSeconds(phone);
    if (failTtl > 0) {
      throw new HttpException(
        {
          code: 'SMS_RETRY_AFTER_COOLDOWN',
          message:
            'Gửi SMS thất bại trước đó. Vui lòng thử lại sau 30 giây hoặc liên hệ hỗ trợ.',
          retryAfterSeconds: failTtl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAtMs = Date.now() + this.ttlSeconds * 1000;
    const session: OtpSession = {
      code,
      purpose,
      attemptsLeft: 3,
      expiresAtMs,
    };

    const message = `[Car Marketplace] Ma OTP cua ban la ${code} (hieu luc ${this.ttlSeconds}s). Khong chia se ma nay.`;

    const ok = await this.sms.sendOtp(phone, message);
    if (!ok) {
      await this.setSmsFailCooldown(phone);
      throw new ServiceUnavailableException({
        code: 'SMS_SEND_FAILED',
        message:
          'Không gửi được SMS. Vui lòng thử lại sau 30 giây hoặc liên hệ hỗ trợ.',
        retryAfterSeconds: this.smsFailCooldownSeconds,
      });
    }

    await this.saveSession(phone, session);
    return { sent: true };
  }

  async verifyOtp(
    phoneRaw: string,
    code: string,
  ): Promise<{ verificationToken: string; expiresIn: string }> {
    const phone = normalizeVietnamPhone(phoneRaw);
    const session = await this.getSession(phone);
    if (!session) {
      throw new BadRequestException({
        code: 'OTP_EXPIRED_OR_MISSING',
        message: 'Mã OTP đã hết hạn hoặc chưa được gửi. Vui lòng gửi lại mã.',
      });
    }

    if (Date.now() > session.expiresAtMs) {
      await this.deleteSession(phone);
      throw new BadRequestException({
        code: 'OTP_EXPIRED',
        message: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.',
      });
    }

    if (session.code !== code) {
      session.attemptsLeft -= 1;
      if (session.attemptsLeft <= 0) {
        await this.deleteSession(phone);
        throw new BadRequestException({
          code: 'OTP_MAX_ATTEMPTS',
          message: 'Nhập sai quá 3 lần. Vui lòng gửi lại mã OTP mới.',
        });
      }
      await this.saveSession(phone, session);
      throw new BadRequestException({
        code: 'OTP_MISMATCH',
        message: 'Mã OTP không đúng.',
        remainingAttempts: session.attemptsLeft,
      });
    }

    await this.deleteSession(phone);
    await this.userClient.markPhoneVerifiedInDb(phone);

    const verificationToken = await this.jwt.signAsync(
      {
        sub: phone,
        purpose: session.purpose,
        tokenType: 'phone_verification',
      },
      {
        expiresIn: 900,
      },
    );

    return {
      verificationToken,
      expiresIn: this.verificationJwtTtl,
    };
  }

  private async getSession(phone: string): Promise<OtpSession | null> {
    if (this.useMemory) {
      const s = this.memory.get(phone);
      if (!s) {
        return null;
      }
      if (Date.now() > s.expiresAtMs) {
        this.memory.delete(phone);
        return null;
      }
      return s;
    }
    const raw = await this.redis!.get(this.sessionKey(phone));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OtpSession;
  }

  private async saveSession(phone: string, session: OtpSession): Promise<void> {
    if (this.useMemory) {
      this.memory.set(phone, session);
      return;
    }
    const ttl = Math.max(
      1,
      Math.ceil((session.expiresAtMs - Date.now()) / 1000),
    );
    await this.redis!.set(
      this.sessionKey(phone),
      JSON.stringify(session),
      'EX',
      ttl,
    );
  }

  private async deleteSession(phone: string): Promise<void> {
    if (this.useMemory) {
      this.memory.delete(phone);
      return;
    }
    await this.redis!.del(this.sessionKey(phone));
  }

  private async getSmsFailTtlSeconds(phone: string): Promise<number> {
    if (this.useMemory) {
      const until = this.memorySmsFail.get(phone);
      if (!until) {
        return 0;
      }
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    }
    const t = await this.redis!.ttl(this.smsFailKey(phone));
    return t > 0 ? t : 0;
  }

  private async setSmsFailCooldown(phone: string): Promise<void> {
    const sec = this.smsFailCooldownSeconds;
    if (this.useMemory) {
      this.memorySmsFail.set(phone, Date.now() + sec * 1000);
      setTimeout(() => this.memorySmsFail.delete(phone), sec * 1000);
      return;
    }
    await this.redis!.set(this.smsFailKey(phone), '1', 'EX', sec);
  }
}
