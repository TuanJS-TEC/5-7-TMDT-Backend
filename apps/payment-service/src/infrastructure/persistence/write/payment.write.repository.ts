import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_STORE } from '../payment.store.token';
import type { PaymentOrderRecord } from '../payment-order.record';

@Injectable()
export class PaymentWriteRepository {
  constructor(
    @Inject(PAYMENT_STORE)
    private readonly store: Map<string, PaymentOrderRecord>,
  ) {}

  async create(record: PaymentOrderRecord): Promise<void> {
    this.store.set(record.id, record);
  }

  async update(id: string, patch: Partial<PaymentOrderRecord>): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    this.store.set(id, { ...existing, ...patch });
  }

  async findById(id: string): Promise<PaymentOrderRecord | undefined> {
    return this.store.get(id);
  }
}
