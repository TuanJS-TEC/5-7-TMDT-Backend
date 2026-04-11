import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentReadRepository } from '../persistence/read/payment.read.repository';
import { PaymentWriteRepository } from '../persistence/write/payment.write.repository';
import { BankReconcileClient } from '../bank/bank-reconcile.client';
import { PaymentOrderCompletionService } from '../../application/services/payment-order-completion.service';

/**
 * UC28 A4 — sau N phút không webhook: đối soát qua Bank API; không thấy GD → EXPIRED
 */
@Injectable()
export class PaymentReconciliationCron {
  private readonly logger = new Logger(PaymentReconciliationCron.name);

  constructor(
    private readonly config: ConfigService,
    private readonly readRepo: PaymentReadRepository,
    private readonly writeRepo: PaymentWriteRepository,
    private readonly bank: BankReconcileClient,
    private readonly completion: PaymentOrderCompletionService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileStaleQrOrders(): Promise<void> {
    const minutes = Number(
      this.config.get<string>('PAYMENT_RECONCILE_AFTER_MINUTES', '15'),
    );
    if (!Number.isFinite(minutes) || minutes < 1) {
      return;
    }

    const stale = await this.readRepo.findPendingQrBankingStale(minutes);
    if (stale.length === 0) {
      return;
    }

    this.logger.log(
      `Reconciliation: ${stale.length} stale QR order(s) (>${minutes}m)`,
    );

    for (const order of stale) {
      const result = await this.bank.checkOrder(order.id, order.amountVnd);

      if (result.status === 'success' && result.transactionId) {
        const done = await this.completion.completeAfterPayment(
          order.id,
          result.transactionId,
          'reconcile',
        );
        if (done) {
          this.logger.log(`Reconcile matched order=${order.id}`);
        }
        continue;
      }

      if (result.status === 'not_found') {
        await this.writeRepo.update(order.id, {
          status: 'expired',
          updatedAt: new Date(),
          errorMessage:
            'UC28 A4 — không tìm thấy giao dịch sau đối soát; có thể thử thanh toán lại.',
        });
        this.logger.warn(`Order ${order.id} marked EXPIRED (reconcile not_found)`);
      }
    }
  }

  /** UC29 — hết phiên thanh toán ví mà không có IPN thành công */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleEWalletSessions(): Promise<void> {
    const rows = await this.readRepo.findPendingEWalletSessionExpired();
    if (rows.length === 0) return;
    this.logger.log(`UC29: ${rows.length} e-wallet order(s) — phiên thanh toán đã hết hạn`);
    const now = new Date();
    for (const order of rows) {
      await this.writeRepo.update(order.id, {
        status: 'expired',
        updatedAt: now,
        errorMessage:
          'Phiên thanh toán ví đã hết hạn — vui lòng tạo đơn mới hoặc khởi tạo lại (UC29).',
      });
    }
  }

  /** UC30 A3 — timeout phiên cổng (20 phút demo) */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleAtmSessions(): Promise<void> {
    const rows = await this.readRepo.findPendingAtmSessionExpired();
    if (rows.length === 0) return;
    this.logger.log(`UC30: ${rows.length} ATM/IB order(s) — phiên cổng đã hết hạn`);
    const now = new Date();
    for (const order of rows) {
      await this.writeRepo.update(order.id, {
        status: 'expired',
        updatedAt: now,
        errorMessage:
          'Phiên thanh toán ATM/Internet Banking đã hết hạn — vui lòng khởi tạo lại (UC30 A3).',
      });
    }
  }
}
