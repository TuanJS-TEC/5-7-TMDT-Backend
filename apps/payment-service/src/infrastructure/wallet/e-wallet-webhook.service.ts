import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentWriteRepository } from '../persistence/write/payment.write.repository';
import { PaymentOrderCompletionService } from '../../application/services/payment-order-completion.service';
import { DemoWalletService } from './demo-wallet.service';
import { EWalletIpTrackerService } from './e-wallet-ip-tracker.service';

export type EWalletIpnBody = {
  order_id: string;
  trans_id: string;
  amount: number;
  result_code: number;
  message: string;
  timestamp: string;
  signature: string;
};

export const E_WALLET_RESULT = {
  SUCCESS: 0,
  USER_CANCELLED: 1001,
  INSUFFICIENT_BALANCE: 1002,
} as const;

export type EWalletWebhookResult = {
  handled: boolean;
  code: string;
  message?: string;
};

@Injectable()
export class EWalletWebhookService {
  private readonly logger = new Logger(EWalletWebhookService.name);

  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly completion: PaymentOrderCompletionService,
    private readonly demoWallet: DemoWalletService,
    private readonly ipTracker: EWalletIpTrackerService,
  ) {}

  /**
   * UC29 bước 8 — IPN từ cổng ví (hoặc luồng nội bộ sau khi xác thực chữ ký).
   */
  async processIpn(body: EWalletIpnBody, clientIp: string): Promise<EWalletWebhookResult> {
    if (this.ipTracker.isBlacklisted(clientIp)) {
      throw new ForbiddenException({
        code: 'IP_BLACKLISTED',
        message: 'IP bị chặn do nhiều lần gửi IPN không hợp lệ.',
      });
    }

    if (!this.demoWallet.hasWebhookSecret()) {
      this.logger.error('PAYMENT_WEBHOOK_SECRET chưa cấu hình — từ chối IPN ví.');
      throw new UnauthorizedException({
        code: 'WEBHOOK_SECRET_MISSING',
        message: 'Webhook chưa được cấu hình.',
      });
    }

    const ok = this.demoWallet.verifyIpnSignature({
      order_id: body.order_id,
      trans_id: body.trans_id,
      amount: body.amount,
      result_code: body.result_code,
      timestamp: body.timestamp,
      signature: body.signature,
    });
    if (!ok) {
      this.ipTracker.recordInvalidSignature(clientIp);
      throw new BadRequestException({
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký IPN không hợp lệ (UC31 UC29 A4).',
      });
    }

    return this.applyVerifiedPayload(body);
  }

  /**
   * Trang sandbox: sau khi kiểm tra token trang thanh toán, ký gọi cùng logic IPN.
   */
  async processSandboxOutcome(
    orderId: string,
    outcome: 'success' | 'cancel' | 'insufficient',
  ): Promise<EWalletWebhookResult> {
    const order = await this.writeRepo.findById(orderId);
    if (!order) {
      return { handled: false, code: 'ORDER_NOT_FOUND' };
    }
    if (!this.demoWallet.isEWalletMethod(order.paymentMethod)) {
      return { handled: false, code: 'NOT_EWALLET_ORDER' };
    }

    const timestamp = this.demoWallet.isoTimestamp();
    const transId = this.demoWallet.generateTransactionId();

    let result_code: number;
    let message: string;
    if (outcome === 'success') {
      result_code = E_WALLET_RESULT.SUCCESS;
      message = 'OK';
    } else if (outcome === 'cancel') {
      result_code = E_WALLET_RESULT.USER_CANCELLED;
      message = 'Bạn đã hủy thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.';
    } else {
      result_code = E_WALLET_RESULT.INSUFFICIENT_BALANCE;
      message = 'Số dư ví không đủ.';
    }

    const signature = this.demoWallet.signIpnPayload({
      order_id: orderId,
      trans_id: transId,
      amount: order.amountVnd,
      result_code,
      timestamp,
    });

    return this.applyVerifiedPayload({
      order_id: orderId,
      trans_id: transId,
      amount: order.amountVnd,
      result_code,
      message,
      timestamp,
      signature,
    });
  }

  private async applyVerifiedPayload(body: EWalletIpnBody): Promise<EWalletWebhookResult> {
    const order = await this.writeRepo.findById(body.order_id);
    if (!order) {
      this.logger.warn(`IPN e-wallet: order_id không tồn tại ${body.order_id}`);
      return {
        handled: false,
        code: 'UNKNOWN_ORDER',
        message: 'Đơn không tồn tại.',
      };
    }

    if (!this.demoWallet.isEWalletMethod(order.paymentMethod)) {
      return {
        handled: false,
        code: 'NOT_EWALLET_ORDER',
        message: 'Đơn không phải ví điện tử.',
      };
    }

    const now = new Date();
    const amountRounded = Math.round(Number(body.amount));

    if (order.status === 'success' && body.result_code === E_WALLET_RESULT.SUCCESS) {
      return { handled: true, code: 'IDEMPOTENT_ALREADY_SUCCESS' };
    }

    if (amountRounded !== order.amountVnd) {
      await this.writeRepo.update(order.id, {
        status: 'amount_mismatch',
        updatedAt: now,
        transactionId: body.trans_id,
        errorMessage: `Số tiền IPN (${amountRounded}) khác đơn (${order.amountVnd}).`,
      });
      return { handled: true, code: 'AMOUNT_MISMATCH' };
    }

    if (body.result_code === E_WALLET_RESULT.SUCCESS) {
      if (order.status !== 'pending' && order.status !== 'processing') {
        return { handled: false, code: 'ORDER_NOT_PAYABLE' };
      }
      const done = await this.completion.completeAfterPayment(
        order.id,
        body.trans_id,
        'e_wallet_webhook',
      );
      if (!done) {
        return { handled: false, code: 'COMPLETE_FAILED' };
      }
      return {
        handled: true,
        code: 'COMPLETED',
        message:
          'Thanh toán thành công — kích hoạt gói (listing) + thông báo (notification).',
      };
    }

    if (body.result_code === E_WALLET_RESULT.USER_CANCELLED) {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'cancelled',
          updatedAt: now,
          errorMessage: body.message || 'Bạn đã hủy thanh toán.',
        });
      }
      return {
        handled: true,
        code: 'CANCELLED',
        message: body.message,
      };
    }

    if (body.result_code === E_WALLET_RESULT.INSUFFICIENT_BALANCE) {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'failed',
          updatedAt: now,
          errorMessage:
            body.message ||
            'Số dư ví không đủ — vui lòng nạp tiền hoặc chọn phương thức khác.',
        });
      }
      return { handled: true, code: 'FAILED_INSUFFICIENT', message: body.message };
    }

    if (order.status === 'pending' || order.status === 'processing') {
      await this.writeRepo.update(order.id, {
        status: 'failed',
        updatedAt: now,
        errorMessage: body.message || 'Giao dịch thất bại.',
      });
    }
    return { handled: true, code: 'FAILED', message: body.message };
  }
}
