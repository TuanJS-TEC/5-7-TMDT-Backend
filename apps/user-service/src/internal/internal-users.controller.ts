import {
  Body,
  Controller,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { InternalSecretGuard } from './internal-secret.guard';
import { PhoneExistsDto } from './dto/phone-exists.dto';
import { InternalRegisterDto } from './dto/internal-register.dto';
import { UsersService } from '../users/users.service';
import { Inject } from '@nestjs/common';
import { normalizeVietnamPhone } from '../users/phone.util';

type UsersApi = Pick<
  UsersService,
  'phoneExists' | 'createUserFromRegister'
>;

@Controller({ path: 'internal/users', version: VERSION_NEUTRAL })
export class InternalUsersController {
  constructor(
    @Inject('USERS_API') private readonly users: UsersApi,
  ) {}

  @Post('phone-exists')
  @UseGuards(InternalSecretGuard)
  async phoneExists(@Body() dto: PhoneExistsDto) {
    const phone = normalizeVietnamPhone(dto.phone);
    const exists = await this.users.phoneExists(phone);
    return { exists };
  }

  @Post('register')
  @UseGuards(InternalSecretGuard)
  async register(@Body() dto: InternalRegisterDto) {
    const phone = normalizeVietnamPhone(dto.phone);
    const user = await this.users.createUserFromRegister({
      fullName: dto.fullName.trim(),
      phone,
      passwordHash: dto.passwordHash,
      accountType: dto.accountType,
    });
    return {
      userId: user.id,
      accountType: user.accountType,
      freePostCredits: user.freePostCredits,
    };
  }
}
