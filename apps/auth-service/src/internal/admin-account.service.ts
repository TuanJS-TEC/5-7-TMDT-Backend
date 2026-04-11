import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';

export interface LockAccountOutcome {
  wasAlreadyLocked: boolean;
  userId: string;
  role: 'buyer' | 'seller' | 'admin';
  adminLocked: boolean;
}

@Injectable()
export class AdminAccountService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async lockAccount(
    userId: string,
    input: { reason: string; lockUntil?: string | null; moderatorId: string },
  ): Promise<LockAccountOutcome> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    if (user.role === 'admin') {
      throw new ForbiddenException({
        code: 'CANNOT_LOCK_ADMIN',
        message: 'Không thể khóa tài khoản quản trị viên.',
      });
    }

    if (user.adminLocked) {
      return {
        wasAlreadyLocked: true,
        userId: user.id,
        role: user.role,
        adminLocked: true,
      };
    }

    user.adminLocked = true;
    user.adminLockReason = input.reason.trim();
    user.adminLockUntil = input.lockUntil
      ? new Date(input.lockUntil)
      : null;

    await this.users.save(user);

    return {
      wasAlreadyLocked: false,
      userId: user.id,
      role: user.role,
      adminLocked: true,
    };
  }
}
