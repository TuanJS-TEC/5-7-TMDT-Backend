import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { normalizeVnPhone, VN_PHONE_REGEX } from './phone.util';

@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperadminBootstrapService.name);

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.config.get<string>('SUPERADMIN_BOOTSTRAP_ENABLED', 'true');
    if (enabled.toLowerCase() !== 'true') {
      return;
    }

    const rawPhone = this.config.get<string>('SUPERADMIN_PHONE', '0900000009');
    const phone = normalizeVnPhone(rawPhone);
    const password = this.config.get<string>('SUPERADMIN_PASSWORD', 'SuperAdmin@123');
    const fullName = this.config.get<string>('SUPERADMIN_FULL_NAME', 'System Superadmin');

    if (typeof phone !== 'string' || !VN_PHONE_REGEX.test(phone)) {
      this.logger.warn(
        `Skip superadmin bootstrap: SUPERADMIN_PHONE "${rawPhone}" is invalid.`,
      );
      return;
    }

    if (!password || password.length < 8) {
      this.logger.warn(
        'Skip superadmin bootstrap: SUPERADMIN_PASSWORD must be at least 8 characters.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await this.users.findOne({ where: { phone } });

    if (!existing) {
      const user = this.users.create({
        phone,
        fullName,
        accountType: 'personal',
        freeListingCredits: 0,
        passwordHash,
        role: 'admin',
        phoneVerified: true,
        adminLocked: false,
        adminLockReason: null,
        adminLockUntil: null,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
        address: '',
        sellerDescription: '',
      });
      await this.users.save(user);
      this.logger.log(`Bootstrapped superadmin account (${phone}).`);
      return;
    }

    existing.fullName = fullName;
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.phoneVerified = true;
    existing.adminLocked = false;
    existing.adminLockReason = null;
    existing.adminLockUntil = null;
    existing.failedLoginAttempts = 0;
    existing.loginLockedUntil = null;
    await this.users.save(existing);

    this.logger.log(`Superadmin account synced (${phone}).`);
  }
}
