import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface SendSellerWarningInput {
  recipientUserId: string;
  reportId: string;
  warningType?: string;
  title: string;
  body: string;
}

export interface SendSellerWarningResult {
  success: boolean;
  primaryChannel: string;
  finalChannel: string;
  fallbackUsed: boolean;
}

export interface SendAccountLockedInput {
  recipientUserId: string;
  reportId?: string;
  reason: string;
  lockUntilIso?: string | null;
}

export type SendAccountLockedResult = SendSellerWarningResult;

@Injectable()
export class NotificationHttpClient {
  private readonly logger = new Logger(NotificationHttpClient.name);
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('NOTIFICATION_SERVICE_URL')?.trim() ??
      'http://localhost:3000';
  }

  async sendSellerWarning(
    input: SendSellerWarningInput,
  ): Promise<SendSellerWarningResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/notifications/seller-warning`;
    const requestId = uuidv4();
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ data: SendSellerWarningResult }>(url, {
          recipientUserId: input.recipientUserId,
          reportId: input.reportId,
          warningType: input.warningType,
          title: input.title,
          body: input.body,
        }, {
          headers: { 'x-request-id': requestId },
          timeout: 15_000,
        }),
      );
      return data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `UC36 — Gọi notification-service thất bại (${url}): ${msg}`,
      );
      throw new ServiceUnavailableException({
        code: 'UC36_NOTIFICATION_SERVICE_UNAVAILABLE',
        message:
          'Không kết nối được dịch vụ thông báo. Vui lòng thử lại sau (UC36 A1).',
      });
    }
  }

  async sendAccountLocked(
    input: SendAccountLockedInput,
  ): Promise<SendAccountLockedResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/notifications/account-locked`;
    const requestId = uuidv4();
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ data: SendAccountLockedResult }>(
          url,
          {
            recipientUserId: input.recipientUserId,
            reportId: input.reportId,
            reason: input.reason,
            lockUntilIso: input.lockUntilIso ?? undefined,
          },
          {
            headers: { 'x-request-id': requestId },
            timeout: 15_000,
          },
        ),
      );
      return data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `UC37 — Gọi notification-service thất bại (${url}): ${msg}`,
      );
      throw new ServiceUnavailableException({
        code: 'UC37_NOTIFICATION_SERVICE_UNAVAILABLE',
        message:
          'Không kết nối được dịch vụ thông báo sau khi khóa tài khoản. Vui lòng kiểm tra và thử lại.',
      });
    }
  }
}
