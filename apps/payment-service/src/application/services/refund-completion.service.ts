import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentWriteRepository } from '../../infrastructure/persistence/write/payment.write.repository';
import { RefundRepository } from '../../infrastructure/persistence/refund.repository';
import { PaymentEventPublisher } from '../../infrastructure/messaging/payment-event.publisher';

/**
 * UC34 — Cập nhật DB + publish sau khi có kết quả từ cổng (sync demo hoặc webhook).
 */
@Injectable()
export class RefundCompletionService {
  private readonly logger = new Logger(RefundCompletionService.name);

  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly refundRepo: RefundRepository,
    private readonly publisher: PaymentEventPublisher,
  ) {}

  async applyGatewaySuccess(
    refundId: string,
    gatewayRefundReference: string,
  ): Promise<void> {
    const refund = await this.refundRepo.findById(refundId);
    if (!refund) {
      throw new NotFoundException({
        code: 'REFUND_NOT_FOUND',
        message: 'Không tìm thấy lệnh hoàn tiền.',
      });
    }
    if (refund.status === 'success') {
      return;
    }
    const order = await this.writeRepo.findById(refund.paymentOrderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn thanh toán gốc.',
      });
    }

    const now = new Date();
    await this.refundRepo.update(refundId, {
      status: 'success',
      gatewayRefundReference,
      errorMessage: null,
    });
    await this.writeRepo.update(order.id, {
      status: 'refunded',
      refundedAt: now,
      updatedAt: now,
    });

    await this.publisher.publishRefundCompleted({
      refundId,
      orderId: order.id,
      userId: order.userId,
      amountVnd: refund.amountVnd,
      originalTransactionId: refund.originalTransactionId,
      listingId: order.listingId ?? null,
      listingPackageType: order.listingPackageType,
      refundedAt: now.toISOString(),
    });
  }

  async applyGatewayFailure(refundId: string, errorMessage: string): Promise<void> {
    const refund = await this.refundRepo.findById(refundId);
    if (!refund) {
      throw new NotFoundException({
        code: 'REFUND_NOT_FOUND',
        message: 'Không tìm thấy lệnh hoàn tiền.',
      });
    }
    if (refund.status === 'failed' || refund.status === 'success') {
      return;
    }
    await this.refundRepo.update(refundId, {
      status: 'failed',
      errorMessage,
    });
    this.logger.warn(
      `[UC34 A1] Hoàn tiền thất bại — refundId=${refundId} orderId=${refund.paymentOrderId} error=${errorMessage} (cần xử lý thủ công / thông báo QTV).`,
    );
  }
}
