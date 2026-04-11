import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InitAtmBankingCommand } from './init-atm-banking.command';
import { PaymentReadRepository } from '../../../infrastructure/persistence/read/payment.read.repository';
import { PaymentWriteRepository } from '../../../infrastructure/persistence/write/payment.write.repository';
import { DemoAtmGatewayService } from '../../../infrastructure/atm/demo-atm-gateway.service';

export type InitAtmBankingResult = {
  orderId: string;
  amountVnd: number;
  paymentUrl: string;
  sessionExpiresAt: string;
  sessionTtlSeconds: number;
  ipnUrl: string;
  returnUrlHint: string;
};

@CommandHandler(InitAtmBankingCommand)
export class InitAtmBankingHandler
  implements ICommandHandler<InitAtmBankingCommand, InitAtmBankingResult>
{
  constructor(
    private readonly readRepo: PaymentReadRepository,
    private readonly writeRepo: PaymentWriteRepository,
    private readonly atmGateway: DemoAtmGatewayService,
  ) {}

  async execute(command: InitAtmBankingCommand): Promise<InitAtmBankingResult> {
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
    if (!this.atmGateway.isAtmInternetBankingMethod(order.paymentMethod)) {
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_NOT_ATM_IB',
        message: 'Đơn không dùng ATM / Internet Banking.',
      });
    }
    if (order.status !== 'pending') {
      throw new BadRequestException({
        code: 'ORDER_NOT_PENDING',
        message: 'Chỉ đơn PENDING mới khởi tạo thanh toán cổng.',
      });
    }

    if (!this.atmGateway.hasWebhookSecret()) {
      throw new ServiceUnavailableException({
        code: 'ATM_GATEWAY_NOT_CONFIGURED',
        message: 'Chưa cấu hình PAYMENT_WEBHOOK_SECRET (ký IPN / URL sandbox).',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.atmGateway.sessionTtlMs);
    let paymentUrl: string;
    try {
      paymentUrl = this.atmGateway.buildPayPageUrl(order.id, expiresAt).url;
    } catch {
      throw new ServiceUnavailableException({
        code: 'ATM_BUILD_URL_FAILED',
        message: 'Không tạo được URL thanh toán.',
      });
    }

    await this.writeRepo.update(order.id, {
      atmPayUrl: paymentUrl,
      atmSessionExpiresAt: expiresAt,
      updatedAt: now,
    });

    const base = this.atmGateway.getPublicApiBase();
    return {
      orderId: order.id,
      amountVnd: order.amountVnd,
      paymentUrl,
      sessionExpiresAt: expiresAt.toISOString(),
      sessionTtlSeconds: Math.floor(this.atmGateway.sessionTtlMs / 1000),
      ipnUrl: `${base}/payments/webhooks/atm-banking`,
      returnUrlHint:
        'Frontend tự cấu hình return_url (redirect sau khi cổng xử lý xong — demo không bắt buộc).',
    };
  }
}
