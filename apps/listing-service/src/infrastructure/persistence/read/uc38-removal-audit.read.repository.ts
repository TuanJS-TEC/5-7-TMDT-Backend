import { Inject, Injectable } from '@nestjs/common';
import { UC38_REMOVAL_AUDIT_STORE } from '../uc38-removal-audit.store.token';
import type { Uc38RemovalAuditRecord } from '../uc38-removal-audit-record';

@Injectable()
export class Uc38RemovalAuditReadRepository {
  constructor(
    @Inject(UC38_REMOVAL_AUDIT_STORE)
    private readonly store: Map<string, Uc38RemovalAuditRecord>,
  ) {}

  async findBySellerId(sellerId: string): Promise<Uc38RemovalAuditRecord[]> {
    const items = [...this.store.values()].filter((x) => x.sellerId === sellerId);
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findAll(): Promise<Uc38RemovalAuditRecord[]> {
    return [...this.store.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}
