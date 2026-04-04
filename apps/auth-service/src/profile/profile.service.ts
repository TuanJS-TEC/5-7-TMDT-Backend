import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { OtpChallengeService } from '../otp/otp-challenge.service';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

const AVATAR_ALLOWED = new Set(['image/jpeg', 'image/png']);
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export interface SellerProfileView {
  fullName: string;
  address: string;
  sellerDescription: string;
  avatarUrl: string | null;
  displayPhone: string | null;
  accountType: string;
  loginPhone: string;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly otp: OtpChallengeService,
  ) {}

  async getSellerProfile(userId: string): Promise<SellerProfileView> {
    const user = await this.loadActiveSeller(userId);
    return this.toView(user);
  }

  async updateSellerProfile(
    userId: string,
    dto: UpdateSellerProfileDto,
  ): Promise<{ profile: SellerProfileView; message: string }> {
    const patchKeys: (keyof UpdateSellerProfileDto)[] = [
      'fullName',
      'address',
      'sellerDescription',
      'displayPhone',
      'avatarUrl',
    ];
    const hasAny = patchKeys.some((k) => dto[k] !== undefined);
    if (!hasAny) {
      throw new BadRequestException({
        code: 'EMPTY_UPDATE',
        message: 'Gửi ít nhất một trường cần cập nhật.',
      });
    }

    const user = await this.loadActiveSeller(userId);

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.address !== undefined) {
      user.address = dto.address.trim();
    }
    if (dto.sellerDescription !== undefined) {
      user.sellerDescription = dto.sellerDescription.trim();
    }
    if (dto.displayPhone !== undefined) {
      const v = dto.displayPhone;
      user.displayPhone =
        v === null || (typeof v === 'string' && v.trim() === '')
          ? null
          : String(v).trim();
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl.trim();
    }

    await this.users.save(user);
    return {
      profile: this.toView(user),
      message: 'Cập nhật hồ sơ thành công.',
    };
  }

  /** UC15 A1 — JPG/PNG ≤5MB, crop 1:1 512px, lưu cục bộ (thay CDN khi tích hợp) */
  async uploadAvatarSquare(
    userId: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ avatarUrl: string; message: string }> {
    if (!AVATAR_ALLOWED.has(mimetype)) {
      throw new BadRequestException({
        code: 'AVATAR_INVALID_TYPE',
        message: 'Ảnh đại diện chỉ chấp nhận định dạng JPG hoặc PNG.',
      });
    }
    if (buffer.length > AVATAR_MAX_BYTES) {
      throw new BadRequestException({
        code: 'AVATAR_TOO_LARGE',
        message: 'Ảnh đại diện tối đa 5MB.',
      });
    }

    await this.loadActiveSeller(userId);

    const dir = join(process.cwd(), 'uploads', 'avatars');
    await fs.mkdir(dir, { recursive: true });
    const filename = `${userId}.jpg`;
    const outPath = join(dir, filename);

    await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 88 })
      .toFile(outPath);

    const publicPath = `/uploads/avatars/${filename}`;
    await this.users.update({ id: userId }, { avatarUrl: publicPath });

    return {
      avatarUrl: publicPath,
      message: 'Cập nhật ảnh đại diện thành công.',
    };
  }

  /** UC15 A2 + UC12 — OTP gửi tới số mới */
  async requestPhoneChangeOtp(userId: string, newPhone: string) {
    const user = await this.loadActiveSeller(userId);
    if (newPhone === user.phone) {
      throw new BadRequestException({
        code: 'SAME_PHONE',
        message: 'Số mới trùng số đăng nhập hiện tại.',
      });
    }
    const taken = await this.users.findOne({ where: { phone: newPhone } });
    if (taken) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_USED',
        message: 'Số điện thoại mới đã được đăng ký bởi tài khoản khác.',
      });
    }
    return this.otp.issue(newPhone, 'phone_change');
  }

  async verifyPhoneChange(userId: string, newPhone: string, code: string) {
    const user = await this.loadActiveSeller(userId);
    if (newPhone === user.phone) {
      throw new BadRequestException({
        code: 'SAME_PHONE',
        message: 'Số mới trùng số đăng nhập hiện tại.',
      });
    }
    const taken = await this.users.findOne({ where: { phone: newPhone } });
    if (taken) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_USED',
        message: 'Số điện thoại mới đã được sử dụng.',
      });
    }

    await this.otp.verifyAndConsume(newPhone, 'phone_change', code);

    user.phone = newPhone;
    user.phoneVerified = true;
    await this.users.save(user);

    return {
      success: true,
      message:
        'Đã cập nhật số điện thoại đăng nhập. Vui lòng đăng nhập lại để làm mới phiên.',
      phone: newPhone,
    };
  }

  private toView(user: UserOrmEntity): SellerProfileView {
    return {
      fullName: user.fullName ?? '',
      address: user.address ?? '',
      sellerDescription: user.sellerDescription ?? '',
      avatarUrl: user.avatarUrl ?? null,
      displayPhone: user.displayPhone ?? null,
      accountType: user.accountType,
      loginPhone: user.phone,
    };
  }

  private async loadActiveSeller(userId: string): Promise<UserOrmEntity> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản.',
      });
    }
    if (user.adminLocked) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED_ADMIN',
        message: 'Tài khoản đang bị khóa. Không thể cập nhật hồ sơ.',
      });
    }
    if (user.role !== 'seller') {
      throw new ForbiddenException({
        code: 'SELLER_ONLY',
        message: 'Chỉ người bán xe mới được dùng tính năng này.',
      });
    }
    return user;
  }
}
