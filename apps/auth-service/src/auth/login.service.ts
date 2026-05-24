import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { AuthSessionResponse, AuthSessionService } from './auth-session.service';
import { LoginDto } from './dto/login.dto';
import { SmsNotificationService } from './sms-notification.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly sessions: AuthSessionService,
    private readonly sms: SmsNotificationService,
  ) {}

  async login(
    dto: LoginDto,
    userAgent: string,
  ): Promise<AuthSessionResponse> {
    const phone = dto.phone;
    const user = await this.users.findOne({ where: { phone } });

    if (!user) {
      throw new NotFoundException({
        code: 'PHONE_NOT_REGISTERED',
        message: 'Số điện thoại chưa được đăng ký',
        hint: 'register',
      });
    }

    const now = new Date();
    if (user.loginLockedUntil && user.loginLockedUntil > now) {
      throw new HttpException(
        {
          code: 'LOGIN_TEMPORARILY_LOCKED',
          message:
            'Tài khoản tạm khóa đăng nhập do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau.',
          lockedUntil: user.loginLockedUntil.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (user.adminLocked) {
      const reason =
        user.adminLockReason?.trim() || 'Vi phạm chính sách hệ thống';
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED_ADMIN',
        message: `Tài khoản bị khóa vì lý do: ${reason}. Vui lòng liên hệ hỗ trợ.`,
        lockReason: reason,
      });
    }

    if (!user.phoneVerified) {
      throw new ForbiddenException({
        code: 'PHONE_NOT_VERIFIED',
        message:
          'Số điện thoại chưa được xác thực. Vui lòng hoàn tất xác thực OTP trước khi đăng nhập.',
      });
    }

    const hash = user.passwordHash?.trim() ?? '';
    if (!hash.startsWith('$2')) {
      throw new UnauthorizedException({
        code: 'INVALID_ACCOUNT',
        message:
          'Tài khoản chưa được thiết lập mật khẩu hợp lệ. Vui lòng đăng ký lại hoặc liên hệ quản trị.',
      });
    }

    const match = await bcrypt.compare(dto.password, hash);
    if (!match) {
      await this.handleWrongPassword(user);
    }

    user.failedLoginAttempts = 0;
    user.loginLockedUntil = null;
    return this.sessions.issueSession(user, userAgent);
  }

  private async handleWrongPassword(user: UserOrmEntity): Promise<never> {
    const next = user.failedLoginAttempts + 1;
    user.failedLoginAttempts = next;

    if (next >= MAX_FAILED_ATTEMPTS) {
      const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.loginLockedUntil = until;
      user.failedLoginAttempts = 0;
      await this.users.save(user);
      void this.sms.sendLoginTempLockNotice(user.phone);
      throw new HttpException(
        {
          code: 'WRONG_PASSWORD_LOCKOUT',
          message:
            'Sai mật khẩu. Bạn đã nhập sai 5 lần liên tiếp; tài khoản bị tạm khóa đăng nhập 15 phút.',
          lockedUntil: until.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.users.save(user);
    throw new UnauthorizedException({
      code: 'WRONG_PASSWORD',
      message: 'Sai mật khẩu',
      remainingAttempts: MAX_FAILED_ATTEMPTS - next,
    });
  }
}
