import { Inject, Injectable } from '@nestjs/common';
import { SELLER_WARNING_STORE } from '../seller-warning.store.token';
import type { SellerWarningRecord } from '../seller-warning-record';

@Injectable()
export class SellerWarningWriteRepository {
  constructor(
    @Inject(SELLER_WARNING_STORE)
    private readonly store: Map<string, SellerWarningRecord>,
  ) {}

  async save(record: SellerWarningRecord): Promise<void> {
    this.store.set(record.id, record);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
