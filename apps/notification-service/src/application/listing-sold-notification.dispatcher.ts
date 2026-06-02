import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ListingSoldPayload } from '@car-marketplace/messaging';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

/**
 * UC25 — thông báo khi tin đăng được đánh dấu đã bán:
 * - Người mua đã lưu yêu thích
 * - Admin (NOTIFICATION_ADMIN_USER_IDS)
 */
@Injectable()
export class ListingSoldNotificationDispatcher {
  private readonly logger = new Logger(ListingSoldNotificationDispatcher.name);

  constructor(private readonly config: ConfigService) {}

  private parseChannelOrder(): NotificationChannel[] {
    const raw =
      this.config.get<string>('NOTIFICATION_LISTING_SOLD_CHANNEL_ORDER')?.trim() ??
      'in_app';
    const allowed = new Set<NotificationChannel>(['email', 'sms', 'in_app']);
    const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const out: NotificationChannel[] = [];
    for (const p of parts) {
      if (allowed.has(p as NotificationChannel)) {
        out.push(p as NotificationChannel);
      }
    }
    return out.length ? out : ['in_app'];
  }

  private buildBody(payload: ListingSoldPayload, audience: 'buyer' | 'admin'): string {
    if (audience === 'admin') {
      return `Showroom đã đánh dấu bán xe: "${payload.title}" (mã tin ${payload.listingId}).`;
    }
    return `Xe bạn đã lưu "${payload.title}" vừa được bán. Hãy xem các tin tương tự khác trên sàn.`;
  }

  private async dispatchToUser(
    userId: string,
    subject: string,
    body: string,
  ): Promise<void> {
    const order = this.parseChannelOrder();
    for (const ch of order) {
      this.logger.log(
        `[UC25][${ch}] userId=${userId} — ${subject}: ${body}`,
      );
      return;
    }
  }

  async dispatchListingSold(payload: ListingSoldPayload): Promise<void> {
    const buyerSubject = 'Xe bạn quan tâm đã được bán';
    const adminSubject = 'Tin đăng đã bán trên sàn';

    for (const userId of payload.favoriteUserIds) {
      if (userId === payload.sellerId) continue;
      await this.dispatchToUser(
        userId,
        buyerSubject,
        this.buildBody(payload, 'buyer'),
      );
    }

    for (const adminId of payload.adminUserIds) {
      await this.dispatchToUser(
        adminId,
        adminSubject,
        this.buildBody(payload, 'admin'),
      );
    }

    this.logger.log(
      `UC25 — Đã gửi thông báo sold listing=${payload.listingId} (${payload.favoriteUserIds.length} buyers, ${payload.adminUserIds.length} admins).`,
    );
  }
}
