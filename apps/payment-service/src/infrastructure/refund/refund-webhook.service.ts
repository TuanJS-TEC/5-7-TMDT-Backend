import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { RefundRepository } from '../persistence/refund.repository';
import { RefundCompletionService } from '../../application/services/refund-completion.service';
import type { RefundWebhookDto } from '../../presentation/dto/refund-webhook.dto';

export type RefundWebhookResult = {
  handled: boolean;
  code: string;
  message?: string;
};

@Injectable()
export class RefundWebhookService {
  private readonly logger = new Logger(RefundWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly refundRepo: RefundRepository,
    private readonly completion: RefundCompletionService,
  ) {}

  async process(body: RefundWebhookDto): Promise<RefundWebhookResult> {
    const secret =
      this.config.get<string>('REFUND_WEBHOOK_SECRET')?.trim() ||
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      this.logger.error(
        'REFUND_WEBHOOK_SECRET / PAYMENT_WEBHOOK_SECRET chưa cấu hình — từ chối UC34 callback.',
      );
      throw new UnauthorizedException({
        code: 'WEBHOOK_SECRET_MISSING',
        message: 'Webhook hoàn tiền chưa được cấu hình.',
      });
    }

    const expected = createHmac('sha256', secret)
      .update(
        `${body.refundId}|${body.paymentOrderId}|${body.status}|${body.amountVnd}|${body.timestamp}`,
      )
      .digest('hex');

    let sigOk = false;
    try {
      sigOk = timingSafeEqual(
        Buffer.from(body.signature, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      sigOk = false;
    }
    if (!sigOk) {
      throw new UnauthorizedException({
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký callback hoàn tiền không hợp lệ.',
      });
    }

    const refund = await this.refundRepo.findById(body.refundId);
    if (!refund) {
      throw new BadRequestException({
        code: 'REFUND_NOT_FOUND',
        message: 'Không tìm thấy lệnh hoàn tiền.',
      });
    }
    if (refund.paymentOrderId !== body.paymentOrderId) {
      throw new BadRequestException({
        code: 'ORDER_MISMATCH',
        message: 'paymentOrderId không khớp lệnh hoàn tiền.',
      });
    }
    if (refund.amountVnd !== body.amountVnd) {
      throw new BadRequestException({
        code: 'AMOUNT_MISMATCH',
        message: 'Số tiền không khớp lệnh hoàn tiền.',
      });
    }

    if (refund.status === 'success' && body.status === 'success') {
      return { handled: true, code: 'DUPLICATE', message: 'Đã hoàn tiền trước đó.' };
    }
    if (refund.status === 'failed' && body.status === 'failed') {
      return { handled: true, code: 'DUPLICATE', message: 'Đã ghi nhận thất bại trước đó.' };
    }
    if (refund.status === 'success' || refund.status === 'failed') {
      throw new ConflictException({
        code: 'REFUND_TERMINAL_STATE',
        message: 'Lệnh hoàn tiền đã kết thúc, không nhận callback trái ngược.',
      });
    }

    if (body.status === 'success') {
      const gwRef =
        body.gatewayRefundReference?.trim() ||
        `WH${Date.now().toString(36).toUpperCase()}`;
      await this.completion.applyGatewaySuccess(refund.id, gwRef);
      return { handled: true, code: 'OK', message: 'Đã cập nhật hoàn tiền thành công.' };
    }

    await this.completion.applyGatewayFailure(
      refund.id,
      body.errorMessage?.trim() ||
        'Cổng từ chối hoàn tiền (callback UC34).',
    );
    return {
      handled: true,
      code: 'OK',
      message: 'Đã ghi nhận hoàn tiền thất bại (UC34 A1).',
    };
  }
}
