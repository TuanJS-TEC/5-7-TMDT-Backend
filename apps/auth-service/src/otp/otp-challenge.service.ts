import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { SmsNotificationService } from '../auth/sms-notification.service';
import { OtpChallengeOrmEntity, OtpPurpose } from './otp-challenge.orm.entity';

const OTP_TTL_MS = 120 * 1000;
const MAX_WRONG_ATTEMPTS = 3;
const BCRYPT_OTP_ROUNDS = 4;
/** UC11 A2 — khóa sau 3 lần sai OTP đăng ký */
const REGISTRATION_LOCK_MS = 5 * 60 * 1000;

@Injectable()
export class OtpChallengeService {
  constructor(
    @InjectRepository(OtpChallengeOrmEntity)
    private readonly repo: Repository<OtpChallengeOrmEntity>,
    private readonly sms: SmsNotificationService,
  ) {}

  /** Xóa challenge (vd. dọn khi hết hạn pending đăng ký) */
  async removeChallenge(phone: string, purpose: OtpPurpose): Promise<void> {
    await this.repo.delete({ phone, purpose });
  }

  /**
   * UC12 bước 2–3 / UC11 bước 4: OTP 6 số, TTL 120s, SMS (A3 nếu lỗi).
   * UC11 A2: đang trong thời gian khóa 5 phút sau 3 lần sai → không gửi OTP mới.
   */
  async issue(
    phone: string,
    purpose: OtpPurpose,
  ): Promise<{ otpTtlSeconds: number; message: string }> {
    const now = new Date();
    let row = await this.repo.findOne({ where: { phone, purpose } });

    if (
      purpose === 'registration' &&
      row?.verifyLockedUntil &&
      row.verifyLockedUntil > now
    ) {
      throw new HttpException(
        {
          code: 'REGISTRATION_OTP_LOCKED',
          message:
            'Bạn đã nhập sai OTP quá 3 lần. Vui lòng chờ 5 phút trước khi gửi lại mã hoặc thử lại.',
          lockedUntil: row.verifyLockedUntil.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const otpHash = await bcrypt.hash(code, BCRYPT_OTP_ROUNDS);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    if (row) {
      row.otpHash = otpHash;
      row.expiresAt = expiresAt;
      row.wrongAttempts = 0;
      if (purpose === 'registration') {
        row.verifyLockedUntil = null;
      }
    } else {
      row = this.repo.create({
        phone,
        purpose,
        otpHash,
        expiresAt,
        wrongAttempts: 0,
        verifyLockedUntil: null,
      });
    }
    row = await this.repo.save(row);

    try {
      await this.sms.sendOtp(phone, code, purpose);
    } catch {
      await this.repo.delete({ id: row.id });
      throw new ServiceUnavailableException({
        code: 'SMS_SEND_FAILED',
        message:
          'Không gửi được SMS. Vui lòng thử lại sau 30 giây hoặc liên hệ hỗ trợ.',
        retryAfterSeconds: 30,
      });
    }

    return {
      otpTtlSeconds: OTP_TTL_MS / 1000,
      message: 'Mã OTP đã được gửi tới số điện thoại của bạn.',
    };
  }

  /**
   * UC12 bước 5–6 / UC11 bước 6: đúng OTP → xóa challenge.
   * UC11 A2: sai 3 lần (registration) → khóa 5 phút, vô hiệu mã hiện tại.
   */
  async verifyAndConsume(
    phone: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const now = new Date();
    const row = await this.repo.findOne({ where: { phone, purpose } });
    if (!row) {
      throw new NotFoundException({
        code: 'NO_ACTIVE_OTP',
        message:
          'Không có mã OTP đang hiệu lực. Vui lòng yêu cầu gửi mã mới.',
      });
    }

    if (
      purpose === 'registration' &&
      row.verifyLockedUntil &&
      row.verifyLockedUntil > now
    ) {
      throw new HttpException(
        {
          code: 'REGISTRATION_OTP_LOCKED',
          message:
            'Bạn đã nhập sai OTP quá 3 lần. Vui lòng chờ trước khi thử lại hoặc gửi lại mã sau khi hết thời gian khóa.',
          lockedUntil: row.verifyLockedUntil.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (row.expiresAt <= now) {
      await this.repo.delete({ id: row.id });
      throw new BadRequestException({
        code: 'OTP_EXPIRED',
        message:
          'Mã OTP đã hết hạn (120 giây). Vui lòng nhấn gửi lại để nhận mã mới.',
      });
    }

    const ok = await bcrypt.compare(code, row.otpHash);
    if (!ok) {
      row.wrongAttempts += 1;
      if (row.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
        if (purpose === 'registration') {
          const until = new Date(now.getTime() + REGISTRATION_LOCK_MS);
          row.verifyLockedUntil = until;
          row.wrongAttempts = 0;
          row.expiresAt = now;
          await this.repo.save(row);
          throw new HttpException(
            {
              code: 'REGISTRATION_OTP_LOCKED',
              message:
                'Bạn đã nhập sai OTP quá 3 lần liên tiếp. Yêu cầu bị tạm khóa 5 phút; sau đó hãy gửi lại mã OTP.',
              lockedUntil: until.toISOString(),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        await this.repo.delete({ id: row.id });
        throw new HttpException(
          {
            code: 'OTP_MAX_ATTEMPTS_RESEND_REQUIRED',
            message:
              'Bạn đã nhập sai OTP 3 lần. Vui lòng yêu cầu gửi lại mã OTP mới.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.repo.save(row);
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Mã OTP không đúng.',
        remainingAttempts: MAX_WRONG_ATTEMPTS - row.wrongAttempts,
      });
    }

    await this.repo.delete({ id: row.id });
  }
}
