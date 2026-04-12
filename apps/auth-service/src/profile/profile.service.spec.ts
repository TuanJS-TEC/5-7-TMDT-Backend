import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { promises as fsp } from 'fs';
import { OtpChallengeService } from '../otp/otp-challenge.service';
import { ProfileService } from './profile.service';

jest.mock('sharp', () => {
  const chain = {
    rotate: () => chain,
    resize: () => chain,
    jpeg: () => chain,
    toFile: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => chain);
});

describe('ProfileService (UC15)', () => {
  let service: ProfileService;
  let users: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let otp: { issue: jest.Mock; verifyAndConsume: jest.Mock };

  const seller = (): UserOrmEntity =>
    ({
      id: 'u1',
      phone: '0901111111',
      fullName: 'Showroom A',
      address: 'HN',
      sellerDescription: 'Mô tả',
      avatarUrl: null,
      displayPhone: null,
      accountType: 'showroom',
      role: 'seller',
      adminLocked: false,
    }) as UserOrmEntity;

  beforeEach(async () => {
    jest.spyOn(fsp, 'mkdir').mockResolvedValue(undefined);

    users = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    otp = {
      issue: jest.fn().mockResolvedValue({ otpTtlSeconds: 120 }),
      verifyAndConsume: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(UserOrmEntity), useValue: users },
        { provide: OtpChallengeService, useValue: otp },
      ],
    }).compile();

    service = module.get(ProfileService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getSellerProfile returns view for active seller', async () => {
    users.findOne.mockResolvedValue(seller());
    const v = await service.getSellerProfile('u1');
    expect(v.fullName).toBe('Showroom A');
    expect(v.loginPhone).toBe('0901111111');
  });

  it('rejects buyer', async () => {
    const u = seller();
    u.role = 'buyer';
    users.findOne.mockResolvedValue(u);
    await expect(service.getSellerProfile('u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects admin locked', async () => {
    const u = seller();
    u.adminLocked = true;
    users.findOne.mockResolvedValue(u);
    await expect(service.getSellerProfile('u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updateSellerProfile rejects empty body', async () => {
    users.findOne.mockResolvedValue(seller());
    await expect(service.updateSellerProfile('u1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updateSellerProfile saves and returns message', async () => {
    users.findOne.mockResolvedValue(seller());
    const res = await service.updateSellerProfile('u1', {
      address: 'Đà Nẵng',
    });
    expect(res.message).toContain('thành công');
    expect(users.save).toHaveBeenCalled();
  });

  it('requestPhoneChangeOtp rejects same phone', async () => {
    const u = seller();
    users.findOne.mockResolvedValue(u);
    await expect(
      service.requestPhoneChangeOtp('u1', u.phone),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requestPhoneChangeOtp rejects taken phone', async () => {
    users.findOne
      .mockResolvedValueOnce(seller())
      .mockResolvedValueOnce({ id: 'other' });
    await expect(
      service.requestPhoneChangeOtp('u1', '0909999999'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifyPhoneChange updates phone', async () => {
    const u = seller();
    users.findOne
      .mockResolvedValueOnce(u)
      .mockResolvedValueOnce(null);
    const res = await service.verifyPhoneChange('u1', '0909999999', '123456');
    expect(res.phone).toBe('0909999999');
    expect(otp.verifyAndConsume).toHaveBeenCalled();
    expect(users.save).toHaveBeenCalled();
  });

  it('uploadAvatarSquare rejects wrong mime', async () => {
    users.findOne.mockResolvedValue(seller());
    await expect(
      service.uploadAvatarSquare('u1', Buffer.from('x'), 'image/gif'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploadAvatarSquare updates user', async () => {
    users.findOne.mockResolvedValue(seller());
    const res = await service.uploadAvatarSquare(
      'u1',
      Buffer.from('fake'),
      'image/jpeg',
    );
    expect(res.avatarUrl).toMatch(/^\/uploads\/avatars\/u1\.jpg$/);
    expect(users.update).toHaveBeenCalledWith(
      { id: 'u1' },
      { avatarUrl: '/uploads/avatars/u1.jpg' },
    );
  });
});
