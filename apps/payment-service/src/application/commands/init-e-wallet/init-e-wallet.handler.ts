import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InitEWalletCommand } from './init-e-wallet.command';
import { PaymentReadRepository } from '../../../infrastructure/persistence/read/payment.read.repository';
import { PaymentWriteRepository } from '../../../infrastructure/persistence/write/payment.write.repository';
import { DemoWalletService } from '../../../infrastructure/wallet/demo-wallet.service';

export type InitEWalletResult = {
  orderId: string;
  paymentMethod: string;
  providerLabel: string;
  amountVnd: number;
  payUrl: string;
  sessionExpiresAt: string;
  sessionTtlSeconds: number;
  ipnUrl: string;
  /** Gợi ý UI: mở URL này (deeplink giả lập) hoặc nhúng QR chứa payUrl */
  qrPayload: string;
};

@CommandHandler(InitEWalletCommand)
export class InitEWalletHandler
  implements ICommandHandler<InitEWalletCommand, InitEWalletResult>
{
  constructor(
    private readonly readRepo: PaymentReadRepository,
    private readonly writeRepo: PaymentWriteRepository,
    private readonly demoWallet: DemoWalletService,
  ) {}

  async execute(command: InitEWalletCommand): Promise<InitEWalletResult> {
    const order = await this.readRepo.findById(command.orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn thanh toán.',
      });
    }
    if (order.userId !== command.userId) {
      throw new ForbiddenException({
        code: 'ORDER_ACCESS_DENIED',
        message: 'Bạn không có quyền truy cập đơn này.',
      });
    }
    if (!this.demoWallet.isEWalletMethod(order.paymentMethod)) {
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_NOT_EWALLET',
        message: 'Đơn không dùng ví điện tử (MoMo / ZaloPay).',
      });
    }
    if (order.status !== 'pending') {
      throw new BadRequestException({
        code: 'ORDER_NOT_PENDING',
        message: 'Chỉ đơn PENDING mới khởi tạo thanh toán ví.',
      });
    }

    if (!this.demoWallet.hasWebhookSecret()) {
      throw new ServiceUnavailableException({
        code: 'EWALLET_NOT_CONFIGURED',
        message:
          'Chưa cấu hình PAYMENT_WEBHOOK_SECRET (dùng ký IPN / trang sandbox ví).',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.demoWallet.sessionTtlMs);
    let payUrl: string;
    try {
      const built = this.demoWallet.buildPayPageUrl(order.id, expiresAt);
      payUrl = built.url;
    } catch {
      throw new ServiceUnavailableException({
        code: 'EWALLET_BUILD_URL_FAILED',
        message: 'Không tạo được URL thanh toán ví (kiểm tra cấu hình).',
      });
    }

    await this.writeRepo.update(order.id, {
      walletPayUrl: payUrl,
      walletSessionExpiresAt: expiresAt,
      updatedAt: now,
    });

    const base = this.demoWallet.getPublicApiBase();
    const ipnUrl = `${base}/payments/webhooks/e-wallet`;

    return {
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      providerLabel: this.demoWallet.providerLabel(order.paymentMethod),
      amountVnd: order.amountVnd,
      payUrl,
      sessionExpiresAt: expiresAt.toISOString(),
      sessionTtlSeconds: Math.floor(this.demoWallet.sessionTtlMs / 1000),
      ipnUrl,
      qrPayload: payUrl,
    };
  }
}
