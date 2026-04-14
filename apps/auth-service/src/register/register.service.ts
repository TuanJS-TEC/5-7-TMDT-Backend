import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/dto/send-otp.dto';
import { UserServiceClient } from '../otp/user-service.client';
import {
  isLikelyVietnamMobile,
  normalizeVietnamPhone,
} from '../otp/phone.util';
import { AccountType } from './account-type.enum';
import { RegisterInitDto } from './dto/register-init.dto';

const PENDING_PREFIX = 'register:pending:';
const LOCK_PREFIX = 'register:lock:';

interface PendingRegister {
  fullName: string;
  passwordHash: string;
  accountType: AccountType;
  expiresAtMs: number;
}

@Injectable()
export class RegisterService {
  private readonly pendingTtlSeconds: number;
  private readonly lockTtlSeconds: number;
  private readonly useMemory: boolean;
  private readonly memoryPending = new Map<string, PendingRegister>();
  private readonly memoryLock = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly userClient: UserServiceClient,
    private readonly jwt: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {
    this.pendingTtlSeconds = parseInt(
      this.config.get<string>('REGISTER_PENDING_TTL_SECONDS', '900'),
      10,
    );
    this.lockTtlSeconds = parseInt(
      this.config.get<string>('REGISTER_LOCK_SECONDS', '300'),
      10,
    );
    this.useMemory =
      this.config.get<string>('SKIP_REDIS', 'false') === 'true' ||
      !this.redis;
  }

  async init(dto: RegisterInitDto) {
    const phone = normalizeVietnamPhone(dto.phone);
    if (!isLikelyVietnamMobile(phone)) {
      throw new BadRequestException({
        code: 'PHONE_INVALID',
        message: 'Số điện thoại không hợp lệ.',
      });
    }

    await this.assertNotLocked(phone);

    const exists = await this.userClient.phoneExists(phone);
    if (exists) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_REGISTERED',
        message:
          'Số điện thoại đã được sử dụng. Vui lòng đăng nhập hoặc khôi phục mật khẩu.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const expiresAtMs = Date.now() + this.pendingTtlSeconds * 1000;
    const pending: PendingRegister = {
      fullName: dto.fullName.trim(),
      passwordHash,
      accountType: dto.accountType,
      expiresAtMs,
    };
    await this.savePending(phone, pending);

    await this.otp.sendOtp(phone, OtpPurpose.REGISTER);

    return {
      nextStep: 'otp',
      countdownSeconds: parseInt(
        this.config.get<string>('OTP_TTL_SECONDS', '120'),
        10,
      ),
    };
  }

  async resendOtp(phoneRaw: string) {
    const phone = normalizeVietnamPhone(phoneRaw);
    if (!isLikelyVietnamMobile(phone)) {
      throw new BadRequestException({ code: 'PHONE_INVALID' });
    }
    await this.assertNotLocked(phone);
    const pending = await this.getPending(phone);
    if (!pending) {
      throw new BadRequestException({
        code: 'REGISTER_SESSION_EXPIRED',
        message:
          'Phiên đăng ký đã hết hạn. Vui lòng nhập lại thông tin từ đầu.',
      });
    }
    await this.otp.sendOtp(phone, OtpPurpose.REGISTER);
    return {
      countdownSeconds: parseInt(
        this.config.get<string>('OTP_TTL_SECONDS', '120'),
        10,
      ),
    };
  }

  async complete(phoneRaw: string, code: string) {
    const phone = normalizeVietnamPhone(phoneRaw);
    await this.assertNotLocked(phone);

    const pending = await this.getPending(phone);
    if (!pending) {
      throw new BadRequestException({
        code: 'REGISTER_SESSION_EXPIRED',
        message: 'Phiên đăng ký đã hết hạn. Vui lòng bắt đầu lại.',
      });
    }

    if (Date.now() > pending.expiresAtMs) {
      await this.deletePending(phone);
      throw new BadRequestException({
        code: 'REGISTER_SESSION_EXPIRED',
        message: 'Phiên đăng ký đã hết hạn.',
      });
    }

    try {
      await this.otp.verifyOtp(phone, code, {
        skipMarkPhoneVerified: true,
        skipVerificationToken: true,
      });
    } catch (err) {
      const codeErr = this.extractErrorCode(err);
      if (codeErr === 'OTP_MAX_ATTEMPTS') {
        await this.setRegisterLock(phone);
      }
      throw err;
    }

    const pendingAfter = await this.getPending(phone);
    if (!pendingAfter) {
      throw new BadRequestException({ code: 'REGISTER_PENDING_LOST' });
    }

    const created = await this.userClient.createRegisteredUser({
      fullName: pendingAfter.fullName,
      phone,
      passwordHash: pendingAfter.passwordHash,
      accountType: pendingAfter.accountType,
    });

    await this.deletePending(phone);

    const accessTtlSeconds = parseInt(
      this.config.get<string>('ACCESS_TOKEN_SECONDS', '604800'),
      10,
    );

    const accessToken = await this.jwt.signAsync(
      {
        sub: created.userId,
        phone,
        tokenType: 'access',
      },
      {
        expiresIn: accessTtlSeconds,
      },
    );

    return {
      accessToken,
      expiresIn: this.config.get<string>('ACCESS_TOKEN_EXPIRES', '7d'),
      welcomeMessage: 'Chào mừng!',
      user: {
        id: created.userId,
        fullName: pendingAfter.fullName,
        accountType: created.accountType,
        freePostCredits: created.freePostCredits,
      },
    };
  }

  private extractErrorCode(err: unknown): string | undefined {
    if (err instanceof HttpException) {
      const r = err.getResponse();
      if (typeof r === 'string') {
        return undefined;
      }
      if (typeof r === 'object' && r !== null) {
        const msg = (r as { message?: unknown }).message;
        if (typeof msg === 'object' && msg !== null && 'code' in msg) {
          return String((msg as { code: string }).code);
        }
        if ('code' in r) {
          return String((r as { code: string }).code);
        }
      }
    }
    return undefined;
  }

  private async assertNotLocked(phone: string): Promise<void> {
    const ttl = await this.getLockTtlSeconds(phone);
    if (ttl > 0) {
      throw new HttpException(
        {
          code: 'REGISTER_LOCKED',
          message:
            'Bạn đã nhập sai OTP quá 3 lần. Vui lòng thử lại sau 5 phút.',
          retryAfterSeconds: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async getLockTtlSeconds(phone: string): Promise<number> {
    if (this.useMemory) {
      const until = this.memoryLock.get(phone);
      if (!until) {
        return 0;
      }
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    }
    const t = await this.redis!.ttl(`${LOCK_PREFIX}${phone}`);
    return t > 0 ? t : 0;
  }

  private async setRegisterLock(phone: string): Promise<void> {
    const sec = this.lockTtlSeconds;
    if (this.useMemory) {
      this.memoryLock.set(phone, Date.now() + sec * 1000);
      return;
    }
    await this.redis!.set(`${LOCK_PREFIX}${phone}`, '1', 'EX', sec);
  }

  private pendingKey(phone: string): string {
    return `${PENDING_PREFIX}${phone}`;
  }

  private async savePending(phone: string, p: PendingRegister): Promise<void> {
    if (this.useMemory) {
      this.memoryPending.set(phone, p);
      return;
    }
    const ttl = Math.max(
      1,
      Math.ceil((p.expiresAtMs - Date.now()) / 1000),
    );
    await this.redis!.set(this.pendingKey(phone), JSON.stringify(p), 'EX', ttl);
  }

  private async getPending(phone: string): Promise<PendingRegister | null> {
    if (this.useMemory) {
      const p = this.memoryPending.get(phone);
      if (!p) {
        return null;
      }
      if (Date.now() > p.expiresAtMs) {
        this.memoryPending.delete(phone);
        return null;
      }
      return p;
    }
    const raw = await this.redis!.get(this.pendingKey(phone));
    if (!raw) {
      return null;
    }
    const p = JSON.parse(raw) as PendingRegister;
    if (Date.now() > p.expiresAtMs) {
      await this.deletePending(phone);
      return null;
    }
    return p;
  }

  private async deletePending(phone: string): Promise<void> {
    if (this.useMemory) {
      this.memoryPending.delete(phone);
      return;
    }
    await this.redis!.del(this.pendingKey(phone));
  }
}
