import { Inject, Injectable } from '@nestjs/common';
import { SELLER_WARNING_STORE } from '../seller-warning.store.token';
import type { SellerWarningRecord } from '../seller-warning-record';

@Injectable()
export class SellerWarningReadRepository {
  constructor(
    @Inject(SELLER_WARNING_STORE)
    private readonly store: Map<string, SellerWarningRecord>,
  ) {}

  async findBySellerId(sellerUserId: string): Promise<SellerWarningRecord[]> {
    const items = [...this.store.values()].filter(
      (w) => w.sellerUserId === sellerUserId,
    );
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
