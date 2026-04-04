import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { AuthSessionService } from './auth-session.service';
import { LoginService } from './login.service';
import { SmsNotificationService } from './sms-notification.service';

describe('LoginService', () => {
  let service: LoginService;
  let users: jest.Mocked<Pick<Repository<UserOrmEntity>, 'findOne' | 'save'>>;
  let sessions: { issueSession: jest.Mock };
  let sms: { sendLoginTempLockNotice: jest.Mock };

  const baseUser = (): UserOrmEntity =>
    ({
      id: 'user-1',
      phone: '0901234567',
      fullName: 'Test',
      accountType: 'personal',
      freeListingCredits: 0,
      passwordHash: 'hashed',
      role: 'buyer',
      phoneVerified: true,
      adminLocked: false,
      adminLockReason: null,
      failedLoginAttempts: 0,
      loginLockedUntil: null,
      lastLoginAt: null,
      lastLoginUserAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as UserOrmEntity;

  beforeEach(async () => {
    users = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };
    sessions = {
      issueSession: jest.fn().mockImplementation(async (user: UserOrmEntity) => ({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          fullName: user.fullName ?? '',
          accountType: user.accountType ?? 'personal',
          freeListingCredits: user.freeListingCredits ?? 0,
        },
        redirectPath: user.role === 'admin' ? '/admin/dashboard' : '/',
      })),
    };
    sms = { sendLoginTempLockNotice: jest.fn().mockResolvedValue(undefined) };

    process.env.JWT_EXPIRES_SEC = '3600';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: getRepositoryToken(UserOrmEntity), useValue: users },
        { provide: AuthSessionService, useValue: sessions },
        { provide: SmsNotificationService, useValue: sms },
      ],
    }).compile();

    service = module.get(LoginService);
  });

  it('throws NotFoundException when phone not registered', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(
      service.login({ phone: '0901234567', password: 'x' }, 'ua'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when admin locked (A2)', async () => {
    const u = baseUser();
    u.adminLocked = true;
    u.adminLockReason = 'Spam';
    users.findOne.mockResolvedValue(u);
    await expect(
      service.login({ phone: '0901234567', password: 'x' }, 'ua'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'ACCOUNT_LOCKED_ADMIN' }),
    });
  });

  it('throws when phone not verified', async () => {
    const u = baseUser();
    u.phoneVerified = false;
    users.findOne.mockResolvedValue(u);
    await expect(
      service.login({ phone: '0901234567', password: 'x' }, 'ua'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('increments failed attempts on wrong password (A1)', async () => {
    const u = baseUser();
    u.passwordHash = await bcrypt.hash('right', 4);
    users.findOne.mockResolvedValue(u);
    await expect(
      service.login({ phone: '0901234567', password: 'wrong' }, 'ua'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'WRONG_PASSWORD',
        remainingAttempts: 4,
      }),
    });
    expect(users.save).toHaveBeenCalled();
  });

  it('locks 15 minutes and sends SMS after 5 wrong passwords', async () => {
    const u = baseUser();
    u.passwordHash = await bcrypt.hash('right', 4);
    u.failedLoginAttempts = 4;
    users.findOne.mockResolvedValue(u);
    await expect(
      service.login({ phone: '0901234567', password: 'wrong' }, 'ua'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(sms.sendLoginTempLockNotice).toHaveBeenCalledWith('0901234567');
    const saved = users.save.mock.calls[0][0] as UserOrmEntity;
    expect(saved.loginLockedUntil).toBeInstanceOf(Date);
    expect(saved.failedLoginAttempts).toBe(0);
  });

  it('returns JWT and redirectPath on success', async () => {
    const u = baseUser();
    u.passwordHash = await bcrypt.hash('secret', 4);
    users.findOne.mockResolvedValue(u);
    const res = await service.login(
      { phone: '0901234567', password: 'secret' },
      'Mozilla',
    );
    expect(res.accessToken).toBe('jwt-token');
    expect(res.redirectPath).toBe('/');
    expect(res.user.role).toBe('buyer');
    expect(sessions.issueSession).toHaveBeenCalled();
  });

  it('redirects admin to dashboard', async () => {
    const u = baseUser();
    u.role = 'admin';
    u.passwordHash = await bcrypt.hash('secret', 4);
    users.findOne.mockResolvedValue(u);
    sessions.issueSession.mockImplementation(async (user: UserOrmEntity) => ({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName ?? '',
        accountType: user.accountType ?? 'personal',
        freeListingCredits: user.freeListingCredits ?? 0,
      },
      redirectPath: '/admin/dashboard',
    }));
    const res = await service.login(
      { phone: '0901234567', password: 'secret' },
      'ua',
    );
    expect(res.redirectPath).toBe('/admin/dashboard');
  });
});
