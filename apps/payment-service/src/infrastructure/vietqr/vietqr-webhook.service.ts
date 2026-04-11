import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentWriteRepository } from '../persistence/write/payment.write.repository';
import { PaymentOrderCompletionService } from '../../application/services/payment-order-completion.service';
import { VietQrService } from './vietqr.service';
import { WEBHOOK_ANOMALY_STORE } from './webhook-anomaly.token';
import type { WebhookAnomalyRecord } from './webhook-anomaly.token';

export type VietQrWebhookInput = {
  order_id: string;
  transaction_id: string;
  amount: number;
  status: string;
  timestamp: string;
  signature: string;
  /** Nội dung CK thực tế từ ngân hàng (nếu cổng gửi kèm) — UC28 A2 */
  transfer_content?: string;
};

export type VietQrWebhookResult = {
  handled: boolean;
  code: string;
  message?: string;
};

@Injectable()
export class VietQrWebhookService {
  private readonly logger = new Logger(VietQrWebhookService.name);

  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly completion: PaymentOrderCompletionService,
    private readonly vietQr: VietQrService,
    private readonly config: ConfigService,
    @Inject(WEBHOOK_ANOMALY_STORE)
    private readonly anomalies: WebhookAnomalyRecord[],
  ) {}

  async process(input: VietQrWebhookInput): Promise<VietQrWebhookResult> {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      this.logger.error('PAYMENT_WEBHOOK_SECRET chưa cấu hình — từ chối webhook.');
      throw new UnauthorizedException({
        code: 'WEBHOOK_SECRET_MISSING',
        message: 'Webhook chưa được cấu hình.',
      });
    }

    const ok = this.vietQr.verifyWebhookSignature({
      order_id: input.order_id,
      transaction_id: input.transaction_id,
      amount: input.amount,
      status: input.status,
      timestamp: input.timestamp,
      signature: input.signature,
    });
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký webhook không hợp lệ.',
      });
    }

    const order = await this.writeRepo.findById(input.order_id);
    if (!order) {
      this.recordAnomaly({
        kind: 'UNKNOWN_ORDER',
        orderId: input.order_id,
        payload: input,
        note: 'Webhook tham chiếu order_id không tồn tại — cần đối soát thủ công (UC28 A2).',
      });
      return {
        handled: false,
        code: 'UNKNOWN_ORDER',
        message: 'Đã ghi nhận giao dịch lạ để đối soát.',
      };
    }

    if (order.paymentMethod !== 'qr_banking') {
      return {
        handled: false,
        code: 'NOT_QR_ORDER',
        message: 'Đơn không phải QR Banking.',
      };
    }

    const normalizedStatus = input.status.trim().toLowerCase();
    const now = new Date();

    if (order.status === 'success' && normalizedStatus === 'success') {
      return { handled: true, code: 'IDEMPOTENT_ALREADY_SUCCESS' };
    }

    const transferContent = input.transfer_content?.trim();
    if (
      transferContent &&
      !transferContent.includes(order.id) &&
      order.status === 'pending'
    ) {
      await this.writeRepo.update(order.id, {
        status: 'pending_manual_review',
        updatedAt: now,
        errorMessage:
          'Nội dung chuyển khoản không khớp order_id — chờ Admin xử lý (UC28 A2).',
      });
      this.logger.warn(
        `UC28 A2: order ${order.id} — transfer_content không chứa order_id. Gửi cảnh báo Admin (email/Zalo).`,
      );
      return {
        handled: true,
        code: 'PENDING_MANUAL_REVIEW',
        message: 'Nội dung CK không khớp — đã chuyển chờ xử lý thủ công.',
      };
    }

    if (normalizedStatus === 'failed' || normalizedStatus === 'failure') {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'failed',
          updatedAt: now,
          errorMessage: 'Giao dịch thất bại theo thông báo từ cổng thanh toán.',
        });
      }
      return { handled: true, code: 'MARKED_FAILED' };
    }

    if (normalizedStatus === 'success') {
      const amountRounded = Math.round(Number(input.amount));
      if (amountRounded !== order.amountVnd) {
        await this.writeRepo.update(order.id, {
          status: 'amount_mismatch',
          updatedAt: now,
          transactionId: input.transaction_id,
          errorMessage: `Số tiền webhook (${amountRounded}) khác đơn (${order.amountVnd}) — UC28 A3.`,
        });
        this.logger.warn(
          `UC28 A3: order ${order.id} amount mismatch. Tạo ticket Admin (hoàn tiền / đối soát).`,
        );
        return {
          handled: true,
          code: 'AMOUNT_MISMATCH',
          message: 'Số tiền không khớp — đơn chuyển trạng thái AMOUNT_MISMATCH.',
        };
      }

      if (order.status !== 'pending' && order.status !== 'processing') {
        return { handled: false, code: 'ORDER_NOT_PAYABLE' };
      }

      const completed = await this.completion.completeAfterPayment(
        order.id,
        input.transaction_id,
        'webhook',
      );
      if (!completed) {
        return { handled: false, code: 'COMPLETE_FAILED' };
      }

      this.logger.log(
        `Thanh toán thành công order=${order.id} tx=${input.transaction_id}. Event listing_package.paid đã gửi.`,
      );
      return {
        handled: true,
        code: 'COMPLETED',
        message:
          'Đơn COMPLETED — kích hoạt gói (listing-service) + thông báo (notification).',
      };
    }

    return {
      handled: false,
      code: 'UNKNOWN_STATUS',
      message: `Trạng thái webhook không hỗ trợ: ${input.status}`,
    };
  }

  private recordAnomaly(a: Omit<WebhookAnomalyRecord, 'id' | 'receivedAt'> & { id?: string }) {
    const row: WebhookAnomalyRecord = {
      id: a.id ?? `anom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      receivedAt: new Date(),
      kind: a.kind,
      orderId: a.orderId,
      payload: a.payload,
      note: a.note,
    };
    this.anomalies.unshift(row);
    if (this.anomalies.length > 500) {
      this.anomalies.length = 500;
    }
    this.logger.warn(
      `Webhook anomaly [${row.kind}] orderId=${row.orderId} — ${row.note}`,
    );
  }
}
