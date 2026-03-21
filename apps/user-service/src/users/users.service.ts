import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

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
