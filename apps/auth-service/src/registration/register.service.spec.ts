import {
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { AuthSessionService } from '../auth/auth-session.service';
import { OtpChallengeService } from '../otp/otp-challenge.service';
import { PendingRegistrationOrmEntity } from './pending-registration.orm.entity';
import { RegisterService } from './register.service';

describe('RegisterService', () => {
  let service: RegisterService;
  let users: { findOne: jest.Mock; save: jest.Mock };
  let pending: {
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let sessions: { issueSession: jest.Mock };
  let otp: { issue: jest.Mock; verifyAndConsume: jest.Mock };

  beforeEach(async () => {
    users = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    pending = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((plain) => ({ ...plain })),
    };
    dataSource = {
      transaction: jest.fn(async (fn: (m: unknown) => Promise<UserOrmEntity>) => {
        const manager = {
          create: (_: unknown, plain: object) => ({
            ...plain,
            id: 'new-user-id',
          }),
          save: jest.fn().mockImplementation(async (u: UserOrmEntity) => u),
          delete: jest.fn().mockResolvedValue({}),
        };
        return fn(manager);
      }),
    };
    sessions = {
      issueSession: jest.fn().mockResolvedValue({
        accessToken: 'jwt',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {},
        redirectPath: '/',
        welcomeMessage: 'Chào mừng',
      }),
    };
    otp = {
      issue: jest.fn().mockResolvedValue({
        otpTtlSeconds: 120,
        message: 'sent',
      }),
      verifyAndConsume: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        { provide: getRepositoryToken(UserOrmEntity), useValue: users },
        {
          provide: getRepositoryToken(PendingRegistrationOrmEntity),
          useValue: pending,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: AuthSessionService, useValue: sessions },
        { provide: OtpChallengeService, useValue: otp },
      ],
    }).compile();

    service = module.get(RegisterService);
  });

  it('requestOtp rejects when phone already registered (A1)', async () => {
    users.findOne.mockResolvedValue({ id: 'x' });
    await expect(
      service.requestOtp({
        fullName: 'A',
        phone: '0901234567',
        password: 'secret12',
        accountType: 'personal',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requestOtp creates pending and issues UC12 OTP', async () => {
    users.findOne.mockResolvedValue(null);
    pending.findOne.mockResolvedValue(null);
    const res = await service.requestOtp({
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      password: 'secret12',
      accountType: 'showroom',
    });
    expect(res.otpTtlSeconds).toBe(120);
    expect(pending.save).toHaveBeenCalled();
    expect(otp.issue).toHaveBeenCalledWith('0901234567', 'registration');
  });

  it('requestOtp rolls back pending when SMS fails', async () => {
    users.findOne.mockResolvedValue(null);
    pending.findOne.mockResolvedValue(null);
    otp.issue.mockRejectedValueOnce(new Error('SMS'));
    await expect(
      service.requestOtp({
        fullName: 'A',
        phone: '0901234567',
        password: 'secret12',
        accountType: 'personal',
      }),
    ).rejects.toThrow('SMS');
    expect(pending.delete).toHaveBeenCalled();
  });

  it('verifyOtp rejects when no pending', async () => {
    pending.findOne.mockResolvedValue(null);
    await expect(
      service.verifyOtpAndCreateUser('0901234567', '123456', 'ua'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('verifyOtp delegates OTP check to OtpChallengeService', async () => {
    const code = '222222';
    const row = {
      id: 'p1',
      phone: '0901234567',
      fullName: 'Showroom X',
      passwordHash: 'hash',
      accountType: 'showroom',
      pendingExpiresAt: new Date(Date.now() + 3600_000),
    };
    pending.findOne.mockResolvedValue(row);
    users.findOne.mockResolvedValue(null);

    let created: Partial<UserOrmEntity> | undefined;
    dataSource.transaction.mockImplementationOnce(
      async (fn: (m: unknown) => Promise<UserOrmEntity>) => {
        const manager = {
          create: (_: unknown, plain: object) => {
            created = plain as Partial<UserOrmEntity>;
            return { ...plain, id: 'u1' } as UserOrmEntity;
          },
          save: jest.fn().mockImplementation(async (u: UserOrmEntity) => u),
          delete: jest.fn().mockResolvedValue({}),
        };
        return fn(manager);
      },
    );

    await service.verifyOtpAndCreateUser('0901234567', code, 'ua');
    expect(otp.verifyAndConsume).toHaveBeenCalledWith(
      '0901234567',
      'registration',
      code,
    );
    expect(created?.role).toBe('seller');
    expect(created?.freeListingCredits).toBe(3);
    expect(sessions.issueSession).toHaveBeenCalled();
  });

  it('resendOtp throws when no pending', async () => {
    pending.findOne.mockResolvedValue(null);
    await expect(service.resendOtp('0901234567')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('verifyOtp throws when pending expired', async () => {
    pending.findOne.mockResolvedValue({
      id: 'p1',
      phone: '0901234567',
      pendingExpiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      service.verifyOtpAndCreateUser('0901234567', '123456', 'ua'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('verifyOtp propagates OTP errors from OtpChallengeService', async () => {
    pending.findOne.mockResolvedValue({
      id: 'p1',
      phone: '0901234567',
      fullName: 'A',
      passwordHash: 'h',
      accountType: 'personal',
      pendingExpiresAt: new Date(Date.now() + 3600_000),
    });
    otp.verifyAndConsume.mockRejectedValueOnce(
      new HttpException({ code: 'OTP_INVALID' }, 400),
    );
    await expect(
      service.verifyOtpAndCreateUser('0901234567', '000000', 'ua'),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
