import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { OtpChallengeService } from './otp-challenge.service';
import type { OtpPurpose } from './otp-challenge.orm.entity';

/**
 * UC12: gửi/xác thực OTP công khai cho đặt lại mật khẩu và xác thực SĐT.
 * (Đăng ký UC11 dùng OtpChallengeService trực tiếp trong RegisterService.)
 */
@Injectable()
export class PhoneOtpFacadeService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly otp: OtpChallengeService,
    private readonly jwt: JwtService,
  ) {}

  async sendPublicOtp(
    phone: string,
    purpose: Extract<OtpPurpose, 'password_reset' | 'phone_verify'>,
  ) {
    const user = await this.users.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException({
        code: 'PHONE_NOT_REGISTERED',
        message: 'Số điện thoại chưa được đăng ký trên hệ thống.',
      });
    }

    if (user.adminLocked) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED_ADMIN',
        message: 'Tài khoản đang bị khóa. Vui lòng liên hệ hỗ trợ.',
      });
    }

    if (purpose === 'password_reset' && !user.phoneVerified) {
      throw new BadRequestException({
        code: 'PHONE_NOT_VERIFIED',
        message:
          'Số điện thoại chưa xác thực; không thể đặt lại mật khẩu qua OTP.',
      });
    }

    if (purpose === 'phone_verify' && user.phoneVerified) {
      throw new BadRequestException({
        code: 'PHONE_ALREADY_VERIFIED',
        message: 'Số điện thoại đã được xác thực trước đó.',
      });
    }

    return this.otp.issue(phone, purpose);
  }

  async verifyPublicOtp(
    phone: string,
    purpose: Extract<OtpPurpose, 'password_reset' | 'phone_verify'>,
    code: string,
  ) {
    const user = await this.users.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException({
        code: 'PHONE_NOT_REGISTERED',
        message: 'Số điện thoại chưa được đăng ký.',
      });
    }

    await this.otp.verifyAndConsume(phone, purpose, code);

    if (purpose === 'phone_verify') {
      user.phoneVerified = true;
      await this.users.save(user);
      return {
        verified: true,
        message: 'Số điện thoại đã được xác thực thành công.',
      };
    }

    const resetSec = Number(process.env.JWT_PASSWORD_RESET_SEC ?? '900');
    const passwordResetToken = await this.jwt.signAsync(
      {
        sub: user.id,
        typ: 'password_reset',
      },
      { expiresIn: resetSec },
    );

    return {
      verified: true,
      passwordResetToken,
      expiresIn: resetSec,
      message:
        'OTP hợp lệ. Sử dụng passwordResetToken để đặt lại mật khẩu.',
    };
  }
}
