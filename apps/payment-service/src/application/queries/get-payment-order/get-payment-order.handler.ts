import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetPaymentOrderQuery } from './get-payment-order.query';
import { PaymentReadRepository } from '../../../infrastructure/persistence/read/payment.read.repository';
import type { PaymentOrderRecord } from '../../../infrastructure/persistence/payment-order.record';
import { DemoWalletService } from '../../../infrastructure/wallet/demo-wallet.service';
import { DemoAtmGatewayService } from '../../../infrastructure/atm/demo-atm-gateway.service';
import { RefundRepository } from '../../../infrastructure/persistence/refund.repository';
import { VietQrService } from '../../../infrastructure/vietqr/vietqr.service';

export type PaymentOrderView = {
  orderId: string;
  status: PaymentOrderRecord['status'];
  paymentMethod: PaymentOrderRecord['paymentMethod'];
  amountVnd: number;
  listingPackageType: string;
  listingId?: string | null;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  errorMessage?: string;
  vietQr?: {
    imageUrl?: string;
    transferContent?: string;
    expiresAt?: string;
    /** true khi quá vietQrExpiresAt và đơn vẫn pending */
    expired: boolean;
    bankName?: string;
    bankBin?: string;
    accountNoMasked?: string;
    accountName?: string;
  };
  /** UC29 — ví điện tử (Demo Sandbox) */
  eWallet?: {
    payUrl?: string;
    sessionExpiresAt?: string;
    sessionExpired: boolean;
    providerLabel: string;
    ipnUrl: string;
  };
  /** UC30 — ATM / Internet Banking (sandbox) */
  atmInternetBanking?: {
    paymentUrl?: string;
    sessionExpiresAt?: string;
    sessionExpired: boolean;
    ipnUrl: string;
  };
  /** UC34 — thời điểm hoàn tiền (khi đơn refunded) */
  refundedAt?: string;
  /** UC34 — lệnh hoàn tiền gần nhất (nếu có) */
  refund?: {
    refundId: string;
    status: string;
    amountVnd: number;
    gatewayRefundReference?: string | null;
    errorMessage?: string | null;
  };
};

@QueryHandler(GetPaymentOrderQuery)
export class GetPaymentOrderHandler
  implements IQueryHandler<GetPaymentOrderQuery, PaymentOrderView>
{
  constructor(
    private readonly readRepo: PaymentReadRepository,
    private readonly config: ConfigService,
    private readonly demoWallet: DemoWalletService,
    private readonly demoAtm: DemoAtmGatewayService,
    private readonly refundRepo: RefundRepository,
    private readonly vietQr: VietQrService,
  ) {}

  async execute(query: GetPaymentOrderQuery): Promise<PaymentOrderView> {
    const order = await this.readRepo.findById(query.orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn thanh toán.',
      });
    }
    if (order.userId !== query.userId) {
      throw new ForbiddenException({
        code: 'ORDER_ACCESS_DENIED',
        message: 'Bạn không có quyền truy cập đơn này.',
      });
    }

    const now = Date.now();
    const exp = order.vietQrExpiresAt?.getTime();
    const qrExpired =
      order.paymentMethod === 'qr_banking' &&
      order.status === 'pending' &&
      typeof exp === 'number' &&
      now > exp;

    const bankBin = this.config.get<string>('VIETQR_BANK_BIN')?.trim();
    const accountNo = this.config.get<string>('VIETQR_ACCOUNT_NO')?.trim();
    const accountName = this.config.get<string>('VIETQR_ACCOUNT_NAME')?.trim();

    const expW = order.walletSessionExpiresAt?.getTime();
    const walletSessionExpired =
      this.demoWallet.isEWalletMethod(order.paymentMethod) &&
      order.status === 'pending' &&
      typeof expW === 'number' &&
      now > expW;

    const expA = order.atmSessionExpiresAt?.getTime();
    const atmSessionExpired =
      this.demoAtm.isAtmInternetBankingMethod(order.paymentMethod) &&
      order.status === 'pending' &&
      typeof expA === 'number' &&
      now > expA;

    const base = this.demoWallet.getPublicApiBase();
    const latestRefund = await this.refundRepo.findLatestByPaymentOrderId(order.id);

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amountVnd: order.amountVnd,
      listingPackageType: order.listingPackageType,
      listingId: order.listingId ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      transactionId: order.transactionId,
      errorMessage: order.errorMessage,
      vietQr:
        order.paymentMethod === 'qr_banking'
          ? {
              imageUrl:
                order.vietQrImageUrl ??
                (this.vietQr.useDemoImage()
                  ? this.vietQr.getDemoImageUrl()
                  : undefined),
              transferContent: order.transferContent ?? order.id,
              expiresAt: order.vietQrExpiresAt?.toISOString(),
              expired: qrExpired,
              bankName: this.config.get<string>('VIETQR_BANK_NAME', 'Ngân hàng thụ hưởng'),
              bankBin: bankBin ?? undefined,
              accountNoMasked: accountNo ? maskAccountNo(accountNo) : undefined,
              accountName: accountName ?? undefined,
            }
          : undefined,
      eWallet: this.demoWallet.isEWalletMethod(order.paymentMethod)
        ? {
            payUrl: order.walletPayUrl,
            sessionExpiresAt: order.walletSessionExpiresAt?.toISOString(),
            sessionExpired: walletSessionExpired,
            providerLabel: this.demoWallet.providerLabel(order.paymentMethod),
            ipnUrl: `${base}/payments/webhooks/e-wallet`,
          }
        : undefined,
      atmInternetBanking: this.demoAtm.isAtmInternetBankingMethod(order.paymentMethod)
        ? {
            paymentUrl: order.atmPayUrl,
            sessionExpiresAt: order.atmSessionExpiresAt?.toISOString(),
            sessionExpired: atmSessionExpired,
            ipnUrl: `${base}/payments/webhooks/atm-banking`,
          }
        : undefined,
      refundedAt: order.refundedAt?.toISOString(),
      refund: latestRefund
        ? {
            refundId: latestRefund.id,
            status: latestRefund.status,
            amountVnd: latestRefund.amountVnd,
            gatewayRefundReference: latestRefund.gatewayRefundReference,
            errorMessage: latestRefund.errorMessage,
          }
        : undefined,
    };
  }
}

function maskAccountNo(accountNo: string): string {
  const digits = accountNo.replace(/\s/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}
