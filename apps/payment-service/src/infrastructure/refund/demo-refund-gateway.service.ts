import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

export type DemoRefundGatewayResult =
  | { ok: true; gatewayRefundReference: string }
  | { ok: false; errorMessage: string };

/**
 * UC34 — Mô phỏng gọi Refund API sang cổng thanh toán (không gọi bank thật).
 */
@Injectable()
export class DemoRefundGatewayService {
  submitRefund(params: {
    refundId: string;
    paymentOrderId: string;
    originalTransactionId: string;
    amountVnd: number;
    simulateGatewayReject: boolean;
  }): DemoRefundGatewayResult {
    if (params.simulateGatewayReject) {
      return {
        ok: false,
        errorMessage:
          'Cổng từ chối hoàn tiền (demo): quá thời hạn hoặc không đủ điều kiện (UC34 A1).',
      };
    }
    const gatewayRefundReference = `RF${randomBytes(6).toString('hex').toUpperCase()}`;
    return { ok: true, gatewayRefundReference };
  }
}
