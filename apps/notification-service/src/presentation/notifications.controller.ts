import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  AccountLockedDispatcher,
  type AccountLockedDispatchResult,
} from '../application/account-locked.dispatcher';
import {
  SellerWarningDispatcher,
  type SellerWarningDispatchResult,
} from '../application/seller-warning.dispatcher';
import { AccountLockedRequestDto } from './dto/account-locked.dto';
import { SellerWarningRequestDto } from './dto/seller-warning.dto';

/**
 * UC60 — HTTP API nội bộ: các use case khác (UC36, …) gọi để gửi thông báo.
 */
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly sellerWarningDispatcher: SellerWarningDispatcher,
    private readonly accountLockedDispatcher: AccountLockedDispatcher,
  ) {}

  /**
   * UC36 — gửi cảnh báo chính thức tới người bán (Email / In-app / SMS theo cấu hình).
   */
  @Post('seller-warning')
  @HttpCode(HttpStatus.OK)
  async sendSellerWarning(
    @Body() dto: SellerWarningRequestDto,
  ): Promise<{ data: SellerWarningDispatchResult }> {
    const data = await this.sellerWarningDispatcher.dispatchSellerWarning({
      recipientUserId: dto.recipientUserId,
      reportId: dto.reportId,
      warningType: dto.warningType,
      title: dto.title,
      body: dto.body,
    });
    return { data };
  }

  /**
   * UC37 bước 5 — thông báo tài khoản bị khóa (UC60).
   */
  @Post('account-locked')
  @HttpCode(HttpStatus.OK)
  async sendAccountLocked(
    @Body() dto: AccountLockedRequestDto,
  ): Promise<{ data: AccountLockedDispatchResult }> {
    const data = await this.accountLockedDispatcher.dispatchAccountLocked({
      recipientUserId: dto.recipientUserId,
      reportId: dto.reportId,
      reason: dto.reason,
      lockUntilIso: dto.lockUntilIso ?? undefined,
    });
    return { data };
  }
}
