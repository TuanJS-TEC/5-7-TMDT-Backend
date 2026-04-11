import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface AuthLockAccountResult {
  wasAlreadyLocked: boolean;
  userId: string;
  role: 'buyer' | 'seller' | 'admin';
  adminLocked: boolean;
}

@Injectable()
export class AuthAccountHttpClient {
  private readonly logger = new Logger(AuthAccountHttpClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async lockAccount(
    userId: string,
    input: { moderatorId: string; reason: string; lockUntil?: string },
  ): Promise<AuthLockAccountResult> {
    const base =
      this.config.get<string>('AUTH_SERVICE_URL')?.trim() ?? 'http://localhost:3001';
    const key = this.config.get<string>('INTERNAL_API_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException({
        code: 'UC37_AUTH_NOT_CONFIGURED',
        message:
          'Chưa cấu hình INTERNAL_API_KEY / AUTH_SERVICE_URL — không thể khóa tài khoản (UC37).',
      });
    }

    const url = `${base.replace(/\/$/, '')}/api/v1/internal/users/${userId}/lock`;
    const requestId = uuidv4();
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ data: AuthLockAccountResult }>(
          url,
          {
            moderatorId: input.moderatorId,
            reason: input.reason,
            lockUntil: input.lockUntil,
          },
          {
            headers: {
              'x-request-id': requestId,
              'x-internal-api-key': key,
            },
            timeout: 15_000,
          },
        ),
      );
      return data.data;
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'Không tìm thấy tài khoản cần khóa.',
        });
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`UC37 — Gọi auth-service thất bại (${url}): ${msg}`);
      throw new ServiceUnavailableException({
        code: 'UC37_AUTH_SERVICE_UNAVAILABLE',
        message:
          'Không kết nối được dịch vụ xác thực để khóa tài khoản. Vui lòng thử lại sau.',
      });
    }
  }
}
