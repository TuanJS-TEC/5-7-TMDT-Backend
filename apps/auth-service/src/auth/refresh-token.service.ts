import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { AuthSessionService, type AuthSessionResponse } from './auth-session.service';

interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    private readonly sessions: AuthSessionService,
  ) {}

  async issueRefreshToken(userId: string): Promise<string> {
    const refreshExpiresSec = Number(process.env.JWT_REFRESH_EXPIRES_SEC) || 60 * 60 * 24 * 30;
    return this.jwt.signAsync(
      { sub: userId, type: 'refresh' } satisfies RefreshPayload,
      { expiresIn: refreshExpiresSec },
    );
  }

  async refreshSession(refreshToken: string, userAgent = ''): Promise<AuthSessionResponse & { refreshToken: string }> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }
    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || user.adminLocked) {
      throw new UnauthorizedException('ACCOUNT_UNAVAILABLE');
    }
    const session = await this.sessions.issueSession(user, userAgent);
    const newRefresh = await this.issueRefreshToken(user.id);
    return { ...session, refreshToken: newRefresh };
  }
}
