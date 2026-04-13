import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaymentOrderRecord } from '../payment-order.record';
import { PaymentOrderOrmEntity } from '../typeorm/payment-order.orm.entity';
import { paymentOrderToRecord } from '../payment-order.mapper';

@Injectable()
export class PaymentWriteRepository {
  constructor(
    @InjectRepository(PaymentOrderOrmEntity)
    private readonly repo: Repository<PaymentOrderOrmEntity>,
  ) {}

  async create(record: PaymentOrderRecord): Promise<void> {
    const row = this.recordToRow(record);
    await this.repo.save(row);
  }

  async update(id: string, patch: Partial<PaymentOrderRecord>): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return;
    const merged = { ...paymentOrderToRecord(existing), ...patch, updatedAt: new Date() };
    await this.repo.save(this.recordToRow(merged));
  }

  async findById(id: string): Promise<PaymentOrderRecord | undefined> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? paymentOrderToRecord(e) : undefined;
  }

  private recordToRow(r: PaymentOrderRecord): PaymentOrderOrmEntity {
    const e = new PaymentOrderOrmEntity();
    e.id = r.id;
    e.userId = r.userId;
    e.listingPackageType = r.listingPackageType;
    e.listingId = r.listingId ?? null;
    e.paymentMethod = r.paymentMethod;
    e.amountVnd = r.amountVnd;
    e.status = r.status;
    e.transactionId = r.transactionId ?? null;
    e.errorMessage = r.errorMessage ?? null;
    e.vietQrImageUrl = r.vietQrImageUrl ?? null;
    e.vietQrGeneratedAt = r.vietQrGeneratedAt ?? null;
    e.vietQrExpiresAt = r.vietQrExpiresAt ?? null;
    e.transferContent = r.transferContent ?? null;
    e.walletPayUrl = r.walletPayUrl ?? null;
    e.walletSessionExpiresAt = r.walletSessionExpiresAt ?? null;
    e.atmPayUrl = r.atmPayUrl ?? null;
    e.atmSessionExpiresAt = r.atmSessionExpiresAt ?? null;
    e.refundedAt = r.refundedAt ?? null;
    e.createdAt = r.createdAt;
    e.updatedAt = r.updatedAt;
    return e;
  }
}
