import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserOrmEntity,
  UserRole,
} from '@car-marketplace/database';

export interface AuthSessionUserPayload {
  id: string;
  phone: string;
  role: UserRole;
  fullName: string;
  accountType: string;
  freeListingCredits: number;
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthSessionUserPayload;
  redirectPath: string;
  welcomeMessage?: string;
  refreshToken?: string;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly jwt: JwtService,
  ) {}

  async issueSession(
    user: UserOrmEntity,
    userAgent: string,
    options?: { welcomeMessage?: string },
  ): Promise<AuthSessionResponse> {
    const now = new Date();
    user.lastLoginAt = now;
    user.lastLoginUserAgent = userAgent || null;
    await this.users.save(user);

    const expiresInSec = this.jwtExpiresSeconds();
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSec,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName ?? '',
        accountType: user.accountType ?? 'personal',
        freeListingCredits: user.freeListingCredits ?? 0,
      },
      redirectPath: this.redirectForRole(user.role),
      welcomeMessage: options?.welcomeMessage,
    };
  }

  jwtExpiresSeconds(): number {
    const sec = Number(process.env.JWT_EXPIRES_SEC);
    return Number.isFinite(sec) && sec > 0 ? sec : 3600;
  }

  private redirectForRole(role: UserRole): string {
    if (role === 'admin') {
      return '/admin/dashboard';
    }
    return '/';
  }
}
