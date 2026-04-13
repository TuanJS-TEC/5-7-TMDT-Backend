import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentWriteRepository } from '../persistence/write/payment.write.repository';
import { PaymentOrderCompletionService } from '../../application/services/payment-order-completion.service';
import { DemoAtmGatewayService } from './demo-atm-gateway.service';
import { AtmBankingIpTrackerService } from './atm-banking-ip-tracker.service';

/** Mã demo (style VNPay): 00 thành công */
export const ATM_RESPONSE = {
  SUCCESS: '00',
  TIMEOUT: '07',
  OTP_FAIL: '05',
  BANK_DECLINE: '51',
  USER_CANCEL: '79',
  GENERIC_FAIL: '99',
} as const;

export type AtmIpnBody = {
  order_id: string;
  transaction_no: string;
  amount: number;
  response_code: string;
  bank_code: string;
  message: string;
  timestamp: string;
  secure_hash: string;
};

export type AtmBankingWebhookResult = {
  handled: boolean;
  code: string;
  message?: string;
};

@Injectable()
export class AtmBankingWebhookService {
  private readonly logger = new Logger(AtmBankingWebhookService.name);

  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly completion: PaymentOrderCompletionService,
    private readonly atmGateway: DemoAtmGatewayService,
    private readonly ipTracker: AtmBankingIpTrackerService,
  ) {}

  async processIpn(body: AtmIpnBody, clientIp: string): Promise<AtmBankingWebhookResult> {
    if (this.ipTracker.isBlacklisted(clientIp)) {
      throw new ForbiddenException({
        code: 'IP_BLACKLISTED',
        message: 'IP bị chặn do nhiều lần gửi IPN không hợp lệ.',
      });
    }

    if (!this.atmGateway.hasWebhookSecret()) {
      this.logger.error('PAYMENT_WEBHOOK_SECRET chưa cấu hình — từ chối IPN ATM.');
      throw new UnauthorizedException({
        code: 'WEBHOOK_SECRET_MISSING',
        message: 'Webhook chưa được cấu hình.',
      });
    }

    const ok = this.atmGateway.verifyIpnSignature({
      order_id: body.order_id,
      transaction_no: body.transaction_no,
      amount: body.amount,
      response_code: body.response_code.trim(),
      bank_code: body.bank_code.trim(),
      timestamp: body.timestamp,
      secure_hash: body.secure_hash,
    });
    if (!ok) {
      this.ipTracker.recordInvalidSignature(clientIp);
      throw new BadRequestException({
        code: 'INVALID_SECURE_HASH',
        message: 'secure_hash không hợp lệ (UC31).',
      });
    }

    return this.applyVerifiedPayload(body);
  }

  async processSandboxOutcome(
    orderId: string,
    outcome:
      | 'success'
      | 'otp_fail'
      | 'bank_reject'
      | 'timeout'
      | 'user_cancel',
  ): Promise<AtmBankingWebhookResult> {
    const order = await this.writeRepo.findById(orderId);
    if (!order) {
      return { handled: false, code: 'ORDER_NOT_FOUND' };
    }
    if (!this.atmGateway.isAtmInternetBankingMethod(order.paymentMethod)) {
      return { handled: false, code: 'NOT_ATM_ORDER' };
    }

    const timestamp = this.atmGateway.isoTimestamp();
    const transaction_no = this.atmGateway.generateTransactionNo();
    const bank_code = 'NCB';

    let response_code: string;
    let message: string;
    switch (outcome) {
      case 'success':
        response_code = ATM_RESPONSE.SUCCESS;
        message = 'Giao dịch thành công (demo).';
        break;
      case 'otp_fail':
        response_code = ATM_RESPONSE.OTP_FAIL;
        message = 'Sai OTP hoặc OTP hết hạn (UC30 A1 — demo).';
        break;
      case 'bank_reject':
        response_code = ATM_RESPONSE.BANK_DECLINE;
        message =
          'Giao dịch bị từ chối bởi ngân hàng. Vui lòng kiểm tra số dư hoặc thử phương thức khác.';
        break;
      case 'timeout':
        response_code = ATM_RESPONSE.TIMEOUT;
        message = 'Hết thời gian thanh toán tại cổng (UC30 A3 — demo).';
        break;
      case 'user_cancel':
        response_code = ATM_RESPONSE.USER_CANCEL;
        message = 'Khách hàng hủy giao dịch tại cổng.';
        break;
      default:
        response_code = ATM_RESPONSE.GENERIC_FAIL;
        message = 'Thất bại (demo).';
    }

    const secure_hash = this.atmGateway.signIpnPayload({
      order_id: orderId,
      transaction_no,
      amount: order.amountVnd,
      response_code,
      bank_code,
      timestamp,
    });

    return this.applyVerifiedPayload({
      order_id: orderId,
      transaction_no,
      amount: order.amountVnd,
      response_code,
      bank_code,
      message,
      timestamp,
      secure_hash,
    });
  }

  private async applyVerifiedPayload(body: AtmIpnBody): Promise<AtmBankingWebhookResult> {
    const order = await this.writeRepo.findById(body.order_id);
    if (!order) {
      return { handled: false, code: 'UNKNOWN_ORDER', message: 'Đơn không tồn tại.' };
    }

    if (!this.atmGateway.isAtmInternetBankingMethod(order.paymentMethod)) {
      return { handled: false, code: 'NOT_ATM_ORDER' };
    }

    const now = new Date();
    const amountRounded = Math.round(Number(body.amount));
    const rc = body.response_code.trim();

    if (order.status === 'success' && rc === ATM_RESPONSE.SUCCESS) {
      return { handled: true, code: 'IDEMPOTENT_ALREADY_SUCCESS' };
    }

    if (amountRounded !== order.amountVnd) {
      await this.writeRepo.update(order.id, {
        status: 'amount_mismatch',
        updatedAt: now,
        transactionId: body.transaction_no,
        errorMessage: `Số tiền IPN (${amountRounded}) khác đơn (${order.amountVnd}).`,
      });
      return { handled: true, code: 'AMOUNT_MISMATCH' };
    }

    if (rc === ATM_RESPONSE.SUCCESS) {
      if (order.status !== 'pending' && order.status !== 'processing') {
        return { handled: false, code: 'ORDER_NOT_PAYABLE' };
      }
      const done = await this.completion.completeAfterPayment(
        order.id,
        body.transaction_no,
        'atm_webhook',
      );
      if (!done) {
        return { handled: false, code: 'COMPLETE_FAILED' };
      }
      return {
        handled: true,
        code: 'COMPLETED',
        message: 'Đơn hoàn tất — kích hoạt gói + thông báo.',
      };
    }

    if (rc === ATM_RESPONSE.TIMEOUT) {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'expired',
          updatedAt: now,
          transactionId: body.transaction_no,
          errorMessage: body.message || 'Timeout cổng thanh toán (UC30 A3).',
        });
      }
      return { handled: true, code: 'EXPIRED', message: body.message };
    }

    if (rc === ATM_RESPONSE.USER_CANCEL) {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'cancelled',
          updatedAt: now,
          errorMessage: body.message || 'Đã hủy tại cổng.',
        });
      }
      return { handled: true, code: 'CANCELLED', message: body.message };
    }

    if (
      rc === ATM_RESPONSE.OTP_FAIL ||
      rc === ATM_RESPONSE.BANK_DECLINE ||
      rc === ATM_RESPONSE.GENERIC_FAIL
    ) {
      if (order.status === 'pending' || order.status === 'processing') {
        await this.writeRepo.update(order.id, {
          status: 'failed',
          updatedAt: now,
          transactionId: body.transaction_no,
          errorMessage: body.message || 'Giao dịch thất bại.',
        });
      }
      return { handled: true, code: 'FAILED', message: body.message };
    }

    if (order.status === 'pending' || order.status === 'processing') {
      await this.writeRepo.update(order.id, {
        status: 'failed',
        updatedAt: now,
        transactionId: body.transaction_no,
        errorMessage: body.message || `Mã ${rc} — giao dịch thất bại.`,
      });
    }
    return { handled: true, code: 'FAILED', message: body.message };
  }
}
