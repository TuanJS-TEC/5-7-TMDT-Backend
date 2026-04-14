import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { AccountType } from './account-type.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async phoneExists(normalizedPhone: string): Promise<boolean> {
    const n = await this.users.count({
      where: { phone: normalizedPhone },
    });
    return n > 0;
  }

  async createUserFromRegister(data: {
    fullName: string;
    phone: string;
    passwordHash: string;
    accountType: AccountType;
  }): Promise<UserEntity> {
    if (await this.phoneExists(data.phone)) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_EXISTS',
        message: 'Số điện thoại đã được sử dụng.',
      });
    }
    const freePostCredits =
      data.accountType === AccountType.SELLER ? 3 : 0;
    const u = this.users.create({
      fullName: data.fullName,
      phone: data.phone,
      passwordHash: data.passwordHash,
      accountType: data.accountType,
      phoneVerifiedAt: new Date(),
      freePostCredits,
    });
    return this.users.save(u);
  }

  async markPhoneVerifiedByPhone(
    normalizedPhone: string,
  ): Promise<'updated' | 'none'> {
    const user = await this.users.findOne({
      where: { phone: normalizedPhone },
    });
    if (!user) {
      return 'none';
    }
    user.phoneVerifiedAt = new Date();
    await this.users.save(user);
    return 'updated';
  }
}
