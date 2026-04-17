import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface AccountLockedDispatchPayload {
  recipientUserId: string;
  reportId?: string;
  reason: string;
  lockUntilIso?: string | null;
}

export interface AccountLockedDispatchResult {
  success: boolean;
  deliveredChannel?: NotificationChannel;
  primaryChannel: NotificationChannel;
  finalChannel: NotificationChannel;
  fallbackUsed: boolean;
}

/**
 * UC37 bước 5 + UC60 — thông báo khóa tài khoản; UC60 A1 — fallback kênh.
 */
@Injectable()
export class AccountLockedDispatcher {
  private readonly logger = new Logger(AccountLockedDispatcher.name);

  constructor(private readonly config: ConfigService) {}

  private parseChannelOrder(): NotificationChannel[] {
    const raw =
      this.config
        .get<string>('NOTIFICATION_ACCOUNT_LOCKED_CHANNEL_ORDER')
        ?.trim() ?? 'email,in_app';
    const allowed = new Set<NotificationChannel>(['email', 'sms', 'in_app']);
    const parts = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const out: NotificationChannel[] = [];
    for (const p of parts) {
      if (allowed.has(p as NotificationChannel)) {
        out.push(p as NotificationChannel);
      }
    }
    return out.length ? out : ['in_app'];
  }

  private buildText(payload: AccountLockedDispatchPayload): string {
    const until = payload.lockUntilIso
      ? ` Thoi han khoa: ${payload.lockUntilIso}.`
      : '';
    return `Tai khoan cua ban da bi khoa boi quan tri vien. Ly do: ${payload.reason}.${until}`;
  }

  private async tryEmail(payload: AccountLockedDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_EMAIL_STUB') === 'true';
    const smtpHost = this.config.get<string>('SMTP_HOST')?.trim();
    if (!stub && !smtpHost) {
      this.logger.warn(
        `UC60 A1 — Email chưa cấu hình — userId=${payload.recipientUserId}`,
      );
      return false;
    }
    const subject = 'Tai khoan bi khoa';
    const body = this.buildText(payload);
    this.logger.log(
      `[UC37][Email] ${stub ? '(stub) ' : ''}user ${payload.recipientUserId}: ${subject} — ${body}`,
    );
    return true;
  }

  private async trySms(payload: AccountLockedDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_SMS_STUB') === 'true';
    const apiKey = this.config.get<string>('SMS_API_KEY')?.trim();
    if (!stub && !apiKey) {
      this.logger.warn(
        `UC60 A1 — SMS chưa cấu hình — userId=${payload.recipientUserId}`,
      );
      return false;
    }
    this.logger.log(
      `[UC37][SMS] ${stub ? '(stub) ' : ''}user ${payload.recipientUserId}: ${this.buildText(payload)}`,
    );
    return true;
  }

  private async tryInApp(payload: AccountLockedDispatchPayload): Promise<boolean> {
    this.logger.log(
      `[UC37][In-app] userId=${payload.recipientUserId} reportId=${payload.reportId ?? 'n/a'} — ${this.buildText(payload)}`,
    );
    return true;
  }

  async dispatchAccountLocked(
    payload: AccountLockedDispatchPayload,
  ): Promise<AccountLockedDispatchResult> {
    if (
      this.config.get<string>('ACCOUNT_LOCKED_SIMULATE_ALL_CHANNELS_FAILURE') ===
      'true'
    ) {
      const order = this.parseChannelOrder();
      return {
        success: false,
        primaryChannel: order[0] ?? 'in_app',
        finalChannel: order[order.length - 1] ?? 'in_app',
        fallbackUsed: order.length > 1,
      };
    }

    const order = this.parseChannelOrder();
    const primaryChannel = order[0] ?? 'in_app';
    let fallbackUsed = false;

    for (let i = 0; i < order.length; i++) {
      const ch = order[i];
      let ok = false;
      if (ch === 'email') {
        ok = await this.tryEmail(payload);
      } else if (ch === 'sms') {
        ok = await this.trySms(payload);
      } else {
        ok = await this.tryInApp(payload);
      }
      if (ok) {
        if (i > 0) {
          fallbackUsed = true;
        }
        this.logger.log(
          `UC37 — Đã gửi thông báo khóa tài khoản qua kênh ${ch} (userId=${payload.recipientUserId}).`,
        );
        return {
          success: true,
          deliveredChannel: ch,
          primaryChannel,
          finalChannel: ch,
          fallbackUsed,
        };
      }
    }

    this.logger.error(
      `UC37 — Không gửi được thông báo khóa tài khoản (userId=${payload.recipientUserId}).`,
    );
    return {
      success: false,
      primaryChannel,
      finalChannel: order[order.length - 1] ?? primaryChannel,
      fallbackUsed: order.length > 1,
    };
  }
}
