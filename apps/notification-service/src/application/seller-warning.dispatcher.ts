import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface SellerWarningDispatchPayload {
  recipientUserId: string;
  reportId?: string;
  warningType?: string;
  title: string;
  body: string;
}

export interface SellerWarningDispatchResult {
  success: boolean;
  deliveredChannel?: NotificationChannel;
  primaryChannel: NotificationChannel;
  finalChannel: NotificationChannel;
  fallbackUsed: boolean;
}

/**
 * UC36 + UC60 — cảnh báo vi phạm tới người bán: thử kênh theo thứ tự;
 * UC60 A1 — kênh lỗi thì chuyển kênh dự phòng.
 */
@Injectable()
export class SellerWarningDispatcher {
  private readonly logger = new Logger(SellerWarningDispatcher.name);

  constructor(private readonly config: ConfigService) {}

  private parseChannelOrder(): NotificationChannel[] {
    const raw =
      this.config
        .get<string>('NOTIFICATION_SELLER_WARNING_CHANNEL_ORDER')
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

  private async tryEmail(payload: SellerWarningDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_EMAIL_STUB') === 'true';
    const smtpHost = this.config.get<string>('SMTP_HOST')?.trim();
    if (!stub && !smtpHost) {
      this.logger.warn(
        `UC60 A1 — Email chưa cấu hình (SMTP_HOST hoặc NOTIFICATION_EMAIL_STUB=true) — userId=${payload.recipientUserId}`,
      );
      return false;
    }
    this.logger.log(
      `[UC36][Email] ${stub ? '(stub) ' : ''}to user ${payload.recipientUserId}: ${payload.title} — ${payload.body}`,
    );
    return true;
  }

  private async trySms(payload: SellerWarningDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_SMS_STUB') === 'true';
    const apiKey = this.config.get<string>('SMS_API_KEY')?.trim();
    if (!stub && !apiKey) {
      this.logger.warn(
        `UC60 A1 — SMS chưa cấu hình (SMS_API_KEY hoặc NOTIFICATION_SMS_STUB=true) — userId=${payload.recipientUserId}`,
      );
      return false;
    }
    this.logger.log(
      `[UC36][SMS] ${stub ? '(stub) ' : ''}user ${payload.recipientUserId}: ${payload.body}`,
    );
    return true;
  }

  private async tryInApp(payload: SellerWarningDispatchPayload): Promise<boolean> {
    this.logger.log(
      `[UC36][In-app] userId=${payload.recipientUserId} reportId=${payload.reportId ?? 'n/a'} — ${payload.title}: ${payload.body}`,
    );
    return true;
  }

  async dispatchSellerWarning(
    payload: SellerWarningDispatchPayload,
  ): Promise<SellerWarningDispatchResult> {
    if (
      this.config.get<string>('SELLER_WARNING_SIMULATE_ALL_CHANNELS_FAILURE') ===
      'true'
    ) {
      this.logger.error(
        `UC36 — Giả lập thất bại mọi kênh (recipientUserId=${payload.recipientUserId}).`,
      );
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
    let finalChannel = primaryChannel;

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
        finalChannel = ch;
        if (i > 0) {
          fallbackUsed = true;
        }
        this.logger.log(
          `UC36 — Đã gửi cảnh báo qua kênh ${ch} (userId=${payload.recipientUserId}).`,
        );
        return {
          success: true,
          deliveredChannel: ch,
          primaryChannel,
          finalChannel,
          fallbackUsed,
        };
      }
    }

    this.logger.error(
      `UC36 — Không gửi được cảnh báo qua bất kỳ kênh nào (userId=${payload.recipientUserId}).`,
    );
    return {
      success: false,
      primaryChannel,
      finalChannel: order[order.length - 1] ?? primaryChannel,
      fallbackUsed: order.length > 1,
    };
  }
}
