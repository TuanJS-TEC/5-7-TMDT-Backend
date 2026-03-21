import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeVietnamPhone } from './phone.util';

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);

  constructor(private readonly config: ConfigService) {}

  async markPhoneVerifiedInDb(phoneNormalized: string): Promise<void> {
    const base = this.config.get<string>('USER_SERVICE_URL', 'http://localhost:3003');
    const secret = this.config.get<string>('INTERNAL_API_SECRET', '');
    const url = `${base.replace(/\/$/, '')}/api/internal/phone/mark-verified`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'x-internal-secret': secret } : {}),
        },
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
}
