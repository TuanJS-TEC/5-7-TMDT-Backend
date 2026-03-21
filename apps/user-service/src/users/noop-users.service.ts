import { Injectable } from '@nestjs/common';

@Injectable()
export class NoopUsersService {
  async markPhoneVerifiedByPhone(
    _normalizedPhone: string,
  ): Promise<'updated' | 'none'> {
    return 'none';
  }
}
