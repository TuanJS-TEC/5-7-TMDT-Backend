import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { SmsNotificationService } from '../auth/sms-notification.service';
import { OtpChallengeOrmEntity } from './otp-challenge.orm.entity';
import { OtpChallengeService } from './otp-challenge.service';

describe('OtpChallengeService (UC12)', () => {
  let service: OtpChallengeService;
  let repo: {
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
  };
  let sms: { sendOtp: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((x) => Promise.resolve(x)),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((p) => ({ ...p, id: 'c1' })),
    };
    sms = { sendOtp: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpChallengeService,
        { provide: getRepositoryToken(OtpChallengeOrmEntity), useValue: repo },
        { provide: SmsNotificationService, useValue: sms },
      ],
    }).compile();

    service = module.get(OtpChallengeService);
  });

  it('issue saves challenge and sends SMS', async () => {
    repo.findOne.mockResolvedValue(null);
    await service.issue('0901234567', 'phone_verify');
    expect(repo.save).toHaveBeenCalled();
    expect(sms.sendOtp).toHaveBeenCalledWith(
      '0901234567',
      expect.any(String),
      'phone_verify',
    );
  });

  it('A3: SMS failure deletes challenge and throws ServiceUnavailable', async () => {
    repo.findOne.mockResolvedValue(null);
    sms.sendOtp.mockRejectedValueOnce(new Error('fail'));
    await expect(
      service.issue('0901234567', 'password_reset'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repo.delete).toHaveBeenCalled();
  });

  it('verifyAndConsume succeeds and deletes row', async () => {
    const code = '123456';
    const hash = await bcrypt.hash(code, 4);
    repo.findOne.mockResolvedValue({
      id: 'x',
      phone: '0901234567',
      purpose: 'registration',
      otpHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      wrongAttempts: 0,
    });
    await service.verifyAndConsume('0901234567', 'registration', code);
    expect(repo.delete).toHaveBeenCalledWith({ id: 'x' });
  });

  it('A2: expired OTP deletes challenge', async () => {
    repo.findOne.mockResolvedValue({
      id: 'x',
      otpHash: 'x',
      expiresAt: new Date(Date.now() - 1000),
      wrongAttempts: 0,
    });
    await expect(
      service.verifyAndConsume('0901234567', 'registration', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.delete).toHaveBeenCalled();
  });

  it('A1: third wrong attempt deletes challenge', async () => {
    const code = '123456';
    const hash = await bcrypt.hash(code, 4);
    repo.findOne.mockResolvedValue({
      id: 'x',
      otpHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      wrongAttempts: 2,
    });
    await expect(
      service.verifyAndConsume('0901234567', 'registration', '999999'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'OTP_MAX_ATTEMPTS_RESEND_REQUIRED',
      }),
    });
    expect(repo.delete).toHaveBeenCalled();
  });
});
