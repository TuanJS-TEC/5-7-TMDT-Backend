import {
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { SmsNotificationService } from '../auth/sms-notification.service';
import { OtpChallengeOrmEntity } from './otp-challenge.orm.entity';
import { OtpChallengeService } from './otp-challenge.service';

describe('OtpChallengeService', () => {
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

  it('UC11: issue blocked when registration verify lock active', async () => {
    const until = new Date(Date.now() + 60_000);
    repo.findOne.mockResolvedValue({
      id: 'x',
      phone: '0901234567',
      purpose: 'registration',
      verifyLockedUntil: until,
    });
    await expect(
      service.issue('0901234567', 'registration'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'REGISTRATION_OTP_LOCKED' }),
    });
    expect(sms.sendOtp).not.toHaveBeenCalled();
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
      verifyLockedUntil: null,
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

  it('UC11 A2: registration third wrong locks 5 min (save, no delete)', async () => {
    const code = '123456';
    const hash = await bcrypt.hash(code, 4);
    repo.findOne.mockResolvedValue({
      id: 'x',
      otpHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      wrongAttempts: 2,
      verifyLockedUntil: null,
    });
    await expect(
      service.verifyAndConsume('0901234567', 'registration', '999999'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'REGISTRATION_OTP_LOCKED' }),
    });
    expect(repo.save).toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('UC12: password_reset third wrong deletes challenge', async () => {
    const code = '123456';
    const hash = await bcrypt.hash(code, 4);
    repo.findOne.mockResolvedValue({
      id: 'x',
      otpHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      wrongAttempts: 2,
    });
    await expect(
      service.verifyAndConsume('0901234567', 'password_reset', '999999'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(repo.delete).toHaveBeenCalledWith({ id: 'x' });
  });

  it('removeChallenge deletes by phone and purpose', async () => {
    await service.removeChallenge('0901234567', 'registration');
    expect(repo.delete).toHaveBeenCalledWith({
      phone: '0901234567',
      purpose: 'registration',
    });
  });
});
