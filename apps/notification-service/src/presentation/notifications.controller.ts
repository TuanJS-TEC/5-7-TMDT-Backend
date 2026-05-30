import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  AccountLockedDispatcher,
  type AccountLockedDispatchResult,
} from '../application/account-locked.dispatcher';
import {
  SellerWarningDispatcher,
  type SellerWarningDispatchResult,
} from '../application/seller-warning.dispatcher';
import {
  ListingModificationRequestedDispatcher,
  type ListingModificationDispatchResult,
} from '../application/listing-modification-requested.dispatcher';
import { AccountLockedRequestDto } from './dto/account-locked.dto';
import { SellerWarningRequestDto } from './dto/seller-warning.dto';
import { ListingModificationRequestedRequestDto } from './dto/listing-modification-requested.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DeviceTokenRegistry } from '../application/device-token.registry';

/**
 * UC60 — HTTP API nội bộ: các use case khác (UC36, …) gọi để gửi thông báo.
 */
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly sellerWarningDispatcher: SellerWarningDispatcher,
    private readonly accountLockedDispatcher: AccountLockedDispatcher,
    private readonly listingModificationDispatcher: ListingModificationRequestedDispatcher,
    private readonly deviceRegistry: DeviceTokenRegistry,
  ) {}

  /** Mobile — đăng ký FCM/APNs device token (mock registry, chưa gửi push thật) */
  @Post('devices/register')
  @HttpCode(HttpStatus.OK)
  registerDevice(@Body() dto: RegisterDeviceDto) {
    const data = this.deviceRegistry.register({
      userId: dto.userId,
      token: dto.token,
      platform: dto.platform,
      registeredAt: new Date().toISOString(),
    });
    return { data };
  }

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
   * UC33 — thông báo seller khi admin yêu cầu chỉnh sửa tin (UC60).
   */
  @Post('listing-modification-requested')
  @HttpCode(HttpStatus.OK)
  async sendListingModificationRequested(
    @Body() dto: ListingModificationRequestedRequestDto,
  ): Promise<{ data: ListingModificationDispatchResult }> {
    const data =
      await this.listingModificationDispatcher.dispatchModificationRequested({
        recipientUserId: dto.recipientUserId,
        listingId: dto.listingId,
        details: dto.details,
        requestedAt: dto.requestedAt,
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
