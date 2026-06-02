import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';

export interface InternalPublicProfileDto {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  displayPhone: string;
  fullPhone: string;
  accountType: 'individual' | 'dealer' | 'admin';
  sellerDescription?: string;
}

@Injectable()
export class InternalPublicProfileService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async getByUserId(userId: string): Promise<InternalPublicProfileDto> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const phone = (user.phone ?? '').trim();
    if (!phone) {
      throw new NotFoundException({
        code: 'SELLER_PHONE_UNAVAILABLE',
        message: 'Người bán chưa có số điện thoại.',
      });
    }

    const display =
      (user.displayPhone ?? '').trim() || this.maskPhone(phone);

    return {
      id: user.id,
      fullName: user.fullName?.trim() || 'Người bán',
      avatarUrl: user.avatarUrl ?? null,
      displayPhone: display,
      fullPhone: phone,
      accountType: this.mapAccountType(user),
      sellerDescription: user.sellerDescription?.trim() || undefined,
    };
  }

  private mapAccountType(
    user: UserOrmEntity,
  ): 'individual' | 'dealer' | 'admin' {
    if (user.role === 'admin') return 'admin';
    if (user.accountType === 'showroom' || user.role === 'seller') {
      return 'dealer';
    }
    return 'individual';
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return '***';
    return `${digits.slice(0, 3)}-xxx-${digits.slice(-3)}`;
  }
}
