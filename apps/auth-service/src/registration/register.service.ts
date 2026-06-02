import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import {
  UserAccountType,
  UserOrmEntity,
  UserRole,
} from '@car-marketplace/database';
import { AuthSessionService } from '../auth/auth-session.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { OtpChallengeService } from '../otp/otp-challenge.service';
import { PendingRegistrationOrmEntity } from './pending-registration.orm.entity';
import { RegisterRequestOtpDto } from './dto/register-request-otp.dto';

const PENDING_TTL_MS = 60 * 60 * 1000;
const BCRYPT_PASSWORD_ROUNDS = 10;

export interface RegisterOtpSentResponse {
  otpTtlSeconds: number;
  message: string;
}

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    @InjectRepository(PendingRegistrationOrmEntity)
    private readonly pending: Repository<PendingRegistrationOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly sessions: AuthSessionService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly otp: OtpChallengeService,
  ) {}

  async requestOtp(dto: RegisterRequestOtpDto): Promise<RegisterOtpSentResponse> {
    const phone = dto.phone;
    const now = new Date();

    const existingUser = await this.users.findOne({ where: { phone } });
    if (existingUser) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_USED',
        message:
          'Số điện thoại đã được sử dụng. Vui lòng đăng nhập hoặc khôi phục mật khẩu.',
        hint: 'login',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_PASSWORD_ROUNDS);
    const pendingExpiresAt = new Date(now.getTime() + PENDING_TTL_MS);

    let row = await this.pending.findOne({ where: { phone } });
    if (row) {
      row.fullName = dto.fullName.trim();
      row.passwordHash = passwordHash;
      row.accountType = dto.accountType;
      row.pendingExpiresAt = pendingExpiresAt;
    } else {
      row = this.pending.create({
        phone,
        fullName: dto.fullName.trim(),
        passwordHash,
        accountType: dto.accountType,
        pendingExpiresAt,
      });
    }
    row = await this.pending.save(row);

    try {
      return await this.otp.issue(phone, 'registration');
    } catch (e) {
      await this.pending.delete({ id: row.id });
      throw e;
    }
  }

  async resendOtp(phone: string): Promise<RegisterOtpSentResponse> {
    const now = new Date();
    const row = await this.pending.findOne({ where: { phone } });
    if (!row) {
      throw new NotFoundException({
        code: 'NO_PENDING_REGISTRATION',
        message:
          'Không có yêu cầu đăng ký đang chờ cho số này. Vui lòng bắt đầu lại.',
      });
    }

    if (row.pendingExpiresAt <= now) {
      await this.pending.delete({ id: row.id });
      await this.otp.removeChallenge(phone, 'registration');
      throw new NotFoundException({
        code: 'NO_PENDING_REGISTRATION',
        message: 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại từ đầu.',
      });
    }

    return this.otp.issue(phone, 'registration');
  }

  async verifyOtpAndCreateUser(
    phone: string,
    code: string,
    userAgent: string,
  ) {
    const now = new Date();
    const row = await this.pending.findOne({ where: { phone } });
    if (!row) {
      throw new NotFoundException({
        code: 'NO_PENDING_REGISTRATION',
        message:
          'Không có yêu cầu đăng ký đang chờ. Vui lòng gửi lại mã OTP từ bước đầu.',
      });
    }

    if (row.pendingExpiresAt <= now) {
      await this.pending.delete({ id: row.id });
      await this.otp.removeChallenge(phone, 'registration');
      throw new NotFoundException({
        code: 'NO_PENDING_REGISTRATION',
        message: 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.',
      });
    }

    await this.otp.verifyAndConsume(phone, 'registration', code);

    const dup = await this.users.findOne({ where: { phone } });
    if (dup) {
      await this.pending.delete({ id: row.id });
      throw new ConflictException({
        code: 'PHONE_ALREADY_USED',
        message: 'Số điện thoại đã được đăng ký trong lúc bạn xác thực.',
      });
    }

    const { role, freeCredits } = this.mapAccountToRole(
      row.accountType as UserAccountType,
    );

    const user = await this.dataSource.transaction(async (manager) => {
      const u = manager.create(UserOrmEntity, {
        phone: row.phone,
        fullName: row.fullName,
        accountType: row.accountType as UserAccountType,
        passwordHash: row.passwordHash,
        role,
        phoneVerified: true,
        freeListingCredits: freeCredits,
        adminLocked: false,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
      });
      await manager.save(u);
      await manager.delete(PendingRegistrationOrmEntity, { id: row.id });
      return u;
    });

    const session = await this.sessions.issueSession(user, userAgent, {
      welcomeMessage: `Chào mừng ${user.fullName} đến với sàn xe!`,
    });
    const refreshToken = await this.refreshTokens.issueRefreshToken(user.id);
    return { ...session, refreshToken };
  }

  private mapAccountToRole(accountType: UserAccountType): {
    role: UserRole;
    freeCredits: number;
  } {
    if (accountType === 'showroom') {
      return { role: 'seller', freeCredits: 3 };
    }
    return { role: 'buyer', freeCredits: 0 };
  }
}
