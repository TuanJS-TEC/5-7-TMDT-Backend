import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ListingModificationRequestedPayload } from '@car-marketplace/messaging';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface ListingModificationDispatchPayload {
  recipientUserId: string;
  listingId: string;
  details: string;
  requestedAt?: string;
}

export interface ListingModificationDispatchResult {
  success: boolean;
  deliveredChannel?: NotificationChannel;
  primaryChannel: NotificationChannel;
  finalChannel: NotificationChannel;
  fallbackUsed: boolean;
}

/**
 * UC33 + UC60 — thông báo seller khi admin yêu cầu chỉnh sửa tin đăng.
 */
@Injectable()
export class ListingModificationRequestedDispatcher {
  private readonly logger = new Logger(ListingModificationRequestedDispatcher.name);

  constructor(private readonly config: ConfigService) {}

  private parseChannelOrder(): NotificationChannel[] {
    const raw =
      this.config
        .get<string>('NOTIFICATION_LISTING_MODIFICATION_CHANNEL_ORDER')
        ?.trim() ?? 'in_app,email';
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

  private buildBody(payload: ListingModificationDispatchPayload): string {
    const when = payload.requestedAt
      ? new Date(payload.requestedAt).toLocaleString('vi-VN')
      : 'vừa xong';
    return (
      `Quản trị viên yêu cầu bạn chỉnh sửa tin đăng (mã ${payload.listingId}, ${when}). ` +
      `Nội dung: ${payload.details}`
    );
  }

  private async tryEmail(payload: ListingModificationDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_EMAIL_STUB') === 'true';
    const smtpHost = this.config.get<string>('SMTP_HOST')?.trim();
    if (!stub && !smtpHost) {
      return false;
    }
    this.logger.log(
      `[UC33][Email] ${stub ? '(stub) ' : ''}user ${payload.recipientUserId}: ${this.buildBody(payload)}`,
    );
    return true;
  }

  private async trySms(payload: ListingModificationDispatchPayload): Promise<boolean> {
    const stub = this.config.get<string>('NOTIFICATION_SMS_STUB') === 'true';
    const apiKey = this.config.get<string>('SMS_API_KEY')?.trim();
    if (!stub && !apiKey) {
      return false;
    }
    this.logger.log(
      `[UC33][SMS] ${stub ? '(stub) ' : ''}user ${payload.recipientUserId}: ${this.buildBody(payload)}`,
    );
    return true;
  }

  private async tryInApp(payload: ListingModificationDispatchPayload): Promise<boolean> {
    this.logger.log(
      `[UC33][In-app] userId=${payload.recipientUserId} listingId=${payload.listingId} — ${this.buildBody(payload)}`,
    );
    return true;
  }

  async dispatchModificationRequested(
    payload: ListingModificationDispatchPayload,
  ): Promise<ListingModificationDispatchResult> {
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
          `UC33 — Đã gửi yêu cầu chỉnh sửa qua ${ch} (userId=${payload.recipientUserId}, listing=${payload.listingId}).`,
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
      `UC33 — Không gửi được thông báo chỉnh sửa (userId=${payload.recipientUserId}).`,
    );
    return {
      success: false,
      primaryChannel,
      finalChannel: order[order.length - 1] ?? primaryChannel,
      fallbackUsed: order.length > 1,
    };
  }

  async dispatchFromEvent(
    event: ListingModificationRequestedPayload,
  ): Promise<ListingModificationDispatchResult> {
    return this.dispatchModificationRequested({
      recipientUserId: event.sellerId,
      listingId: event.listingId,
      details: event.details,
      requestedAt: event.requestedAt,
    });
  }
}
