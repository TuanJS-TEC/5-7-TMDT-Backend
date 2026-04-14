import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ReportRecord } from '../../infrastructure/persistence/report-record';
import { AuthAccountHttpClient } from '../../infrastructure/auth/auth-account-http.client';
import { NotificationHttpClient } from '../../infrastructure/notifications/notification-http.client';
import { SellerWarningService } from './seller-warning.service';
import { SellerListingsRemovalService } from './seller-listings-removal.service';

export interface AccountLockParams {
  moderatorId: string;
  reason: string;
  lockUntil?: string;
  reportId?: string;
}

@Injectable()
export class AccountLockService {
  constructor(
    private readonly sellerWarningService: SellerWarningService,
    private readonly sellerListingsRemovalService: SellerListingsRemovalService,
    private readonly authAccountHttpClient: AuthAccountHttpClient,
    private readonly notificationHttpClient: NotificationHttpClient,
  ) {}

  async lockAccountForReport(
    report: ReportRecord,
    params: AccountLockParams,
  ): Promise<{
    userId: string;
    role: 'buyer' | 'seller' | 'admin';
    listingsRemoved: number;
    notification: {
      primaryChannel: string;
      finalChannel: string;
      fallbackUsed: boolean;
    };
  }> {
    const userId = await this.sellerWarningService.resolveSellerUserId(report);
    return this.executeLock(userId, {
      ...params,
      reportId: report.id,
    });
  }

  async lockAccountByUserId(
    userId: string,
    params: AccountLockParams,
  ): Promise<{
    userId: string;
    role: 'buyer' | 'seller' | 'admin';
    listingsRemoved: number;
    notification: {
      primaryChannel: string;
      finalChannel: string;
      fallbackUsed: boolean;
    };
  }> {
    return this.executeLock(userId, params);
  }

  private async executeLock(
    userId: string,
    params: AccountLockParams,
  ): Promise<{
    userId: string;
    role: 'buyer' | 'seller' | 'admin';
    listingsRemoved: number;
    notification: {
      primaryChannel: string;
      finalChannel: string;
      fallbackUsed: boolean;
    };
  }> {
    const lock = await this.authAccountHttpClient.lockAccount(userId, {
      moderatorId: params.moderatorId,
      reason: params.reason,
      lockUntil: params.lockUntil,
    });

    if (lock.wasAlreadyLocked) {
      throw new BadRequestException({
        code: 'UC37_ACCOUNT_ALREADY_LOCKED',
        message: 'Tai khoan da bi khoa truoc do (UC37 A1).',
      });
    }

    let listingsRemoved = 0;
    if (lock.role === 'seller') {
      const uc38 = await this.sellerListingsRemovalService.removeAllActiveListings(
        userId,
        {
          moderatorId: params.moderatorId,
          note: params.reason,
          reportId: params.reportId,
          source: 'uc37_account_lock',
        },
      );
      listingsRemoved = uc38.count;
    }

    const notify = await this.notificationHttpClient.sendAccountLocked({
      recipientUserId: userId,
      reportId: params.reportId,
      reason: params.reason,
      lockUntilIso: params.lockUntil ?? null,
    });

    if (!notify.success) {
      throw new ServiceUnavailableException({
        code: 'UC37_NOTIFICATION_FAILED',
        accountLocked: true,
        listingsRemoved,
        message:
          'Tai khoan da bi khoa nhung khong gui duoc thong bao qua bat ky kenh nao. Vui long kiem tra notification-service.',
      });
    }

    return {
      userId: lock.userId,
      role: lock.role,
      listingsRemoved,
      notification: {
        primaryChannel: notify.primaryChannel,
        finalChannel: notify.finalChannel,
        fallbackUsed: notify.fallbackUsed,
      },
    };
  }
}
