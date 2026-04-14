import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeVietnamPhone } from './phone.util';

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);

  constructor(private readonly config: ConfigService) {}

  private headers(): Record<string, string> {
    const secret = this.config.get<string>('INTERNAL_API_SECRET', '');
    return {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-internal-secret': secret } : {}),
    };
  }

  private baseUrl(): string {
    return this.config.get<string>('USER_SERVICE_URL', 'http://localhost:3003').replace(/\/$/, '');
  }

  async markPhoneVerifiedInDb(phoneNormalized: string): Promise<void> {
    const url = `${this.baseUrl()}/api/internal/phone/mark-verified`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          phone: normalizeVietnamPhone(phoneNormalized),
        }),
      });

      if (!res.ok && res.status !== 404 && res.status !== 204) {
        const text = await res.text();
        this.logger.warn(
          `user-service mark-verified ${res.status}: ${text}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `user-service unreachable, phone verified in OTP only: ${(e as Error).message}`,
      );
    }
  }

  async phoneExists(phoneNormalized: string): Promise<boolean> {
    const url = `${this.baseUrl()}/api/internal/users/phone-exists`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ phone: phoneNormalized }),
      });
      if (!res.ok) {
        this.logger.warn(`phone-exists ${res.status}`);
        throw new BadRequestException({
          code: 'USER_SERVICE_UNAVAILABLE',
          message: 'Không kiểm tra được số điện thoại. Thử lại sau.',
        });
      }
      const data = (await res.json()) as { exists: boolean };
      return data.exists === true;
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      this.logger.warn(`phoneExists: ${(e as Error).message}`);
      throw new BadRequestException({
        code: 'USER_SERVICE_UNAVAILABLE',
        message: 'Không kết nối được user-service.',
      });
    }
  }

  async createRegisteredUser(data: {
    fullName: string;
    phone: string;
    passwordHash: string;
    accountType: string;
  }): Promise<{
    userId: string;
    accountType: string;
    freePostCredits: number;
  }> {
    const url = `${this.baseUrl()}/api/internal/users/register`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        passwordHash: data.passwordHash,
        accountType: data.accountType,
      }),
    });

    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      throw new ConflictException(body);
    }

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`createRegisteredUser ${res.status}: ${text}`);
      throw new BadRequestException({
        code: 'USER_CREATE_FAILED',
        message: 'Không tạo được tài khoản.',
      });
    }

    return res.json() as Promise<{
      userId: string;
      accountType: string;
      freePostCredits: number;
    }>;
  }
}
