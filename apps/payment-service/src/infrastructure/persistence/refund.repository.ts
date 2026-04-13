import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRefundOrmEntity } from './typeorm/payment-refund.orm.entity';
import type { PaymentRefundRecord, PaymentRefundStatus } from './payment-refund.record';

function toRecord(e: PaymentRefundOrmEntity): PaymentRefundRecord {
  return {
    id: e.id,
    paymentOrderId: e.paymentOrderId,
    originalTransactionId: e.originalTransactionId,
    amountVnd: e.amountVnd,
    status: e.status as PaymentRefundStatus,
    reason: e.reason,
    createdByAdminUserId: e.createdByAdminUserId,
    gatewayRefundReference: e.gatewayRefundReference,
    errorMessage: e.errorMessage,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

@Injectable()
export class RefundRepository {
  constructor(
    @InjectRepository(PaymentRefundOrmEntity)
    private readonly repo: Repository<PaymentRefundOrmEntity>,
  ) {}

  async create(r: Omit<PaymentRefundRecord, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PaymentRefundRecord> {
    const e = new PaymentRefundOrmEntity();
    if (r.id) e.id = r.id;
    e.paymentOrderId = r.paymentOrderId;
    e.originalTransactionId = r.originalTransactionId;
    e.amountVnd = r.amountVnd;
    e.status = r.status;
    e.reason = r.reason;
    e.createdByAdminUserId = r.createdByAdminUserId;
    e.gatewayRefundReference = r.gatewayRefundReference;
    e.errorMessage = r.errorMessage;
    const saved = await this.repo.save(e);
    return toRecord(saved);
  }

  async update(id: string, patch: Partial<PaymentRefundRecord>): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    if (patch.status !== undefined) existing.status = patch.status;
    if (patch.gatewayRefundReference !== undefined) {
      existing.gatewayRefundReference = patch.gatewayRefundReference;
    }
    if (patch.errorMessage !== undefined) existing.errorMessage = patch.errorMessage;
    await this.repo.save(existing);
  }

  async findById(id: string): Promise<PaymentRefundRecord | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toRecord(e) : null;
  }

  async findSuccessfulByPaymentOrderId(
    paymentOrderId: string,
  ): Promise<PaymentRefundRecord | null> {
    const e = await this.repo.findOne({
      where: { paymentOrderId, status: 'success' },
    });
    return e ? toRecord(e) : null;
  }

  async findLatestByPaymentOrderId(paymentOrderId: string): Promise<PaymentRefundRecord | null> {
    const e = await this.repo.findOne({
      where: { paymentOrderId },
      order: { createdAt: 'DESC' },
    });
    return e ? toRecord(e) : null;
  }
}
