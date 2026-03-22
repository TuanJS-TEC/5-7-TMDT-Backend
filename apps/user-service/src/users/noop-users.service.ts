import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UserEntity } from './user.entity';
import { AccountType } from './account-type.enum';

@Injectable()
export class NoopUsersService {
  async markPhoneVerifiedByPhone(
    _normalizedPhone: string,
  ): Promise<'updated' | 'none'> {
    return 'none';
  }

  async phoneExists(_normalizedPhone: string): Promise<boolean> {
    return false;
  }

  async createUserFromRegister(_data: {
    fullName: string;
    phone: string;
    passwordHash: string;
    accountType: AccountType;
  }): Promise<UserEntity> {
    throw new ServiceUnavailableException({
      code: 'USER_DB_UNAVAILABLE',
      message: 'User database not available (SKIP_DATABASE).',
    });
  }
}
