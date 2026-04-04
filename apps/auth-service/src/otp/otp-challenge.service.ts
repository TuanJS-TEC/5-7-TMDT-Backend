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

@Injectable()
export class OtpChallengeService {
  constructor(
    @InjectRepository(OtpChallengeOrmEntity)
    private readonly repo: Repository<OtpChallengeOrmEntity>,
    private readonly sms: SmsNotificationService,
  ) {}

  /**
   * UC12 bước 2–3: tạo OTP 6 số, TTL 120s, lưu DB, gửi SMS (A3 nếu lỗi).
   */
  async issue(
    phone: string,
    purpose: OtpPurpose,
  ): Promise<{ otpTtlSeconds: number; message: string }> {
    const now = new Date();
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const otpHash = await bcrypt.hash(code, BCRYPT_OTP_ROUNDS);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    let row = await this.repo.findOne({ where: { phone, purpose } });
    if (row) {
      row.otpHash = otpHash;
      row.expiresAt = expiresAt;
      row.wrongAttempts = 0;
    } else {
      row = this.repo.create({
        phone,
        purpose,
        otpHash,
        expiresAt,
        wrongAttempts: 0,
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
   * UC12 bước 5–6: kiểm tra OTP; thành công thì xóa challenge khỏi DB.
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
