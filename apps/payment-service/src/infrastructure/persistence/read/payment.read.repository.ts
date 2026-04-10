import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_STORE } from '../payment.store.token';
import type { PaymentOrderRecord } from '../payment-order.record';

@Injectable()
export class PaymentReadRepository {
  constructor(
    @Inject(PAYMENT_STORE)
    private readonly store: Map<string, PaymentOrderRecord>,
  ) {}

  async findById(id: string): Promise<PaymentOrderRecord | null> {
    return this.store.get(id) || null;
  }

  async findByUserId(userId: string): Promise<PaymentOrderRecord[]> {
    return Array.from(this.store.values()).filter(order => order.userId === userId);
  }
}
