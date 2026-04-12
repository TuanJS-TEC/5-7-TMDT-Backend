import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly jwt: JwtService,
  ) {}

  async complete(passwordResetToken: string, newPassword: string) {
    let payload: { sub: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; typ?: string }>(
        passwordResetToken,
      );
    } catch {
      throw new UnauthorizedException({
        code: 'PASSWORD_RESET_TOKEN_INVALID',
        message:
          'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ bước OTP.',
      });
    }

    if (payload.typ !== 'password_reset') {
      throw new BadRequestException({
        code: 'INVALID_TOKEN_TYPE',
        message: 'Token không dùng cho đặt lại mật khẩu.',
      });
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'Tài khoản không tồn tại.',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.failedLoginAttempts = 0;
    user.loginLockedUntil = null;
    await this.users.save(user);

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.',
    };
  }
}
