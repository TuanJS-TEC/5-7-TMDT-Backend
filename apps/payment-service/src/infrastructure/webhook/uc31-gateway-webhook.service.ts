import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentWriteRepository } from '../persistence/write/payment.write.repository';
import { PaymentOrderCompletionService } from '../../application/services/payment-order-completion.service';
import type { Uc31GatewayWebhookDto } from '../../presentation/dto/uc31-gateway-webhook.dto';
import type { PaymentOrderRecord } from '../persistence/payment-order.record';
import { Uc31WebhookIpTrackerService } from './uc31-webhook-ip-tracker.service';

export type Uc31WebhookResponse = Record<string, unknown>;

/**
 * UC31 — Xác nhận thanh toán qua webhook cổng (nguồn tin cậy, không phụ thuộc browser).
 */
@Injectable()
export class Uc31GatewayWebhookService {
  private readonly logger = new Logger(Uc31GatewayWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly writeRepo: PaymentWriteRepository,
    private readonly completion: PaymentOrderCompletionService,
    private readonly ipTracker: Uc31WebhookIpTrackerService,
  ) {}

  /**
   * Xử lý webhook: trả body JSON; mã HTTP do controller/exception quyết định (200 khi tiếp nhận hợp lệ).
   */
  async process(
    body: Uc31GatewayWebhookDto,
    clientIp: string,
  ): Promise<Uc31WebhookResponse> {
    this.logger.log(`UC31_WEBHOOK_RAW ${JSON.stringify(body)}`);

    if (this.ipTracker.isBlacklisted(clientIp)) {
      throw new ForbiddenException({
        code: 'IP_BLACKLISTED',
        message: 'IP bị chặn (UC31 A2).',
      });
    }

    const whitelist = this.config.get<string>('PAYMENT_WEBHOOK_IP_WHITELIST')?.trim();
    if (whitelist) {
      const allowed = whitelist
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!allowed.includes(clientIp)) {
        this.logger.warn(
          `UC31: IP không nằm whitelist — ip=${clientIp}, allowed=${allowed.length} entries`,
        );
        throw new ForbiddenException({
          code: 'IP_NOT_WHITELISTED',
          message: 'IP nguồn không được phép (UC31 bước 3).',
        });
      }
    }

    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      this.logger.error('PAYMENT_WEBHOOK_SECRET chưa cấu hình — từ chối UC31.');
      throw new UnauthorizedException({
        code: 'WEBHOOK_SECRET_MISSING',
        message: 'Webhook chưa được cấu hình.',
      });
    }

    if (!this.verifySignature(body, secret)) {
      this.ipTracker.recordInvalidSignature(clientIp);
      throw new BadRequestException({
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký không khớp (UC31 A2).',
      });
    }

    const order = await this.writeRepo.findById(body.order_id);
    if (!order) {
      this.logger.warn(`UC31: order_id không tồn tại ${body.order_id}`);
      throw new BadRequestException({
        code: 'ORDER_NOT_FOUND',
        message: 'Đơn không tồn tại.',
      });
    }

    const amountWh = Math.round(Number(body.amount));
    if (amountWh !== order.amountVnd) {
      const now = new Date();
      await this.writeRepo.update(order.id, {
        status: 'amount_mismatch',
        updatedAt: now,
        transactionId: body.transaction_id,
        errorMessage: `UC31 A4 — amount webhook (${amountWh}) ≠ đơn (${order.amountVnd}). Cần ticket Admin (UC34).`,
      });
      this.logger.error(
        `UC31 A4 AMOUNT_MISMATCH order=${order.id} webhook=${amountWh} db=${order.amountVnd} — tạo ticket Admin / đối soát.`,
      );
      return {
        success: true,
        code: 'AMOUNT_MISMATCH',
        message: 'Đã ghi nhận — không kích hoạt gói.',
      };
    }

    if (body.status === 'SUCCESS') {
      return this.handleSuccess(body, order);
    }

    if (body.status === 'FAILED') {
      return this.handleFailed(body, order);
    }

    throw new BadRequestException({ code: 'INVALID_STATUS', message: 'status không hợp lệ.' });
  }

  private async handleSuccess(
    body: Uc31GatewayWebhookDto,
    order: PaymentOrderRecord,
  ): Promise<Uc31WebhookResponse> {
    if (order.status === 'success') {
      this.logger.warn(
        `DUPLICATE_WEBHOOK UC31 order=${body.order_id} — idempotent 200, không xử lý lại.`,
      );
      return {
        success: true,
        duplicate: true,
        code: 'DUPLICATE_WEBHOOK',
        message: 'Đơn đã COMPLETED trước đó.',
      };
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      this.logger.warn(
        `UC31: SUCCESS webhook nhưng đơn không payable status=${order.status} order=${body.order_id}`,
      );
      return {
        success: true,
        ignored: true,
        code: 'ORDER_NOT_PAYABLE',
        message: 'Trạng thái đơn không cho phép hoàn tất.',
      };
    }

    const done = await this.completion.completeAfterPayment(
      order.id,
      body.transaction_id,
      'uc31_gateway_webhook',
    );
    if (!done) {
      this.logger.error(`UC31: completeAfterPayment failed order=${order.id}`);
      throw new Error('UC31_INTERNAL_COMPLETE_FAILED');
    }

    this.logger.log(
      `UC31 COMPLETED order=${order.id} tx=${body.transaction_id} — gói tin đã publish (listing) + thông báo async.`,
    );

    return {
      success: true,
      code: 'COMPLETED',
      order_id: order.id,
      transaction_id: body.transaction_id,
    };
  }

  private async handleFailed(
    body: Uc31GatewayWebhookDto,
    order: PaymentOrderRecord,
  ): Promise<Uc31WebhookResponse> {
    const now = new Date();

    if (order.status === 'failed' && body.status === 'FAILED') {
      this.logger.warn(`DUPLICATE_WEBHOOK UC31 FAILED order=${body.order_id}`);
      return { success: true, duplicate: true, code: 'DUPLICATE_WEBHOOK_FAILED' };
    }

    if (order.status === 'success') {
      this.logger.warn(
        `DUPLICATE_WEBHOOK UC31 (FAILED sau SUCCESS) order=${body.order_id} — bỏ qua`,
      );
      return { success: true, duplicate: true, code: 'DUPLICATE_WEBHOOK_IGNORED' };
    }

    if (order.status === 'pending' || order.status === 'processing') {
      await this.writeRepo.update(order.id, {
        status: 'failed',
        updatedAt: now,
        transactionId: body.transaction_id,
        errorMessage:
          body.failure_reason?.trim() ||
          'Thanh toán thất bại (UC31 A1). Vui lòng thử lại.',
      });
      this.logger.log(`UC31 A1 FAILED order=${body.order_id} — 200 OK để cổng không retry.`);
      return {
        success: true,
        code: 'MARKED_FAILED',
        message: 'Đơn FAILED — không kích hoạt gói; thông báo người bán async.',
      };
    }

    this.logger.warn(
      `UC31 A1 FAILED webhook order=${body.order_id} — status=${order.status}, không ghi đè.`,
    );
    return {
      success: true,
      code: 'FAILED_NOT_APPLIED',
      message: 'Đơn không ở trạng thái chờ thanh toán.',
    };
  }

  private verifySignature(body: Uc31GatewayWebhookDto, secret: string): boolean {
    const canonical = [
      body.order_id,
      body.transaction_id,
      String(Math.round(Number(body.amount))),
      body.currency,
      body.status,
      body.timestamp,
    ].join('|');
    const expected = createHmac('sha256', secret).update(canonical).digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(body.signature.trim(), 'hex'),
      );
    } catch {
      return false;
    }
  }
}
