import { Inject, Injectable } from '@nestjs/common';
import { UC38_REMOVAL_AUDIT_STORE } from '../uc38-removal-audit.store.token';
import type { Uc38RemovalAuditRecord } from '../uc38-removal-audit-record';

@Injectable()
export class Uc38RemovalAuditWriteRepository {
  constructor(
    @Inject(UC38_REMOVAL_AUDIT_STORE)
    private readonly store: Map<string, Uc38RemovalAuditRecord>,
  ) {}

  async save(record: Uc38RemovalAuditRecord): Promise<void> {
    this.store.set(record.id, record);
  }
}
