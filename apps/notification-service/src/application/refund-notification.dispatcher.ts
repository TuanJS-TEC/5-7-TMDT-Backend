import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RefundCompletedPayload } from '@car-marketplace/messaging';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

/**
 * UC60 — gửi thông báo hoàn tiền: thử các kênh theo thứ tự ưu tiên;
 * UC60 A1 — kênh lỗi thì chuyển kênh dự phòng (fallback).
 */
@Injectable()
export class RefundNotificationDispatcher {
  private readonly logger = new Logger(RefundNotificationDispatcher.name);

  constructor(private readonly config: ConfigService) {}

  private parseChannelOrder(): NotificationChannel[] {
    const raw =
      this.config
        .get<string>('NOTIFICATION_REFUND_CHANNEL_ORDER')
        ?.trim() ?? 'in_app';
    const allowed = new Set<NotificationChannel>([
      'email',
      'sms',
      'in_app',
    ]);
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

  private async tryEmail(
    payload: RefundCompletedPayload,
  ): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_EMAIL_STUB') === 'true';
    const smtpHost = this.config.get<string>('SMTP_HOST')?.trim();
    if (!stub && !smtpHost) {
      this.logger.warn(
        `UC60 A1 — Email chưa cấu hình (SMTP_HOST hoặc NOTIFICATION_EMAIL_STUB=true) — userId=${payload.userId}`,
      );
      return false;
    }
    const subject = 'Hoàn tiền gói tin đăng thành công';
    const body = this.buildBody(payload);
    this.logger.log(
      `[UC60][Email] ${stub ? '(stub) ' : ''}to user ${payload.userId}: ${subject} — ${body}`,
    );
    return true;
  }

  private async trySms(payload: RefundCompletedPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_SMS_STUB') === 'true';
    const apiKey = this.config.get<string>('SMS_API_KEY')?.trim();
    if (!stub && !apiKey) {
      this.logger.warn(
        `UC60 A1 — SMS chưa cấu hình (SMS_API_KEY hoặc NOTIFICATION_SMS_STUB=true) — userId=${payload.userId}`,
      );
      return false;
    }
    const text = this.buildBody(payload);
    this.logger.log(
      `[UC60][SMS] ${stub ? '(stub) ' : ''}user ${payload.userId}: ${text}`,
    );
    return true;
  }

  private async tryInApp(payload: RefundCompletedPayload): Promise<boolean> {
    const body = this.buildBody(payload);
    this.logger.log(
      `[UC60][In-app] userId=${payload.userId} refundId=${payload.refundId} — ${body}`,
    );
    return true;
  }

  private buildBody(p: RefundCompletedPayload): string {
    const amount = p.amountVnd.toLocaleString('vi-VN');
    return `Đơn ${p.orderId}: đã hoàn ${amount} VND (mã hoàn ${p.refundId}). Gói ${p.listingPackageType}.`;
  }

  async dispatchRefundCompleted(
    payload: RefundCompletedPayload,
  ): Promise<void> {
    const order = this.parseChannelOrder();
    for (const ch of order) {
      let ok = false;
      if (ch === 'email') {
        ok = await this.tryEmail(payload);
      } else if (ch === 'sms') {
        ok = await this.trySms(payload);
      } else {
        ok = await this.tryInApp(payload);
      }
      if (ok) {
        this.logger.log(
          `UC60 — Đã gửi thông báo hoàn tiền qua kênh ${ch} (refundId=${payload.refundId}).`,
        );
        return;
      }
    }
    this.logger.error(
      `UC60 — Không gửi được qua bất kỳ kênh nào (refundId=${payload.refundId}, order=${payload.orderId}).`,
    );
  }
}
