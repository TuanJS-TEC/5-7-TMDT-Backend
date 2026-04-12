import { Inject, Injectable } from '@nestjs/common';
import { REPORT_STORE } from '../report.store.token';
import { ReportRecord } from '../report-record';

@Injectable()
export class ReportWriteRepository {
  constructor(
    @Inject(REPORT_STORE)
    private readonly store: Map<string, ReportRecord>,
  ) {}

  async create(record: ReportRecord): Promise<void> {
    this.store.set(record.id, record);
  }

  async update(id: string, patch: Partial<ReportRecord>): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }

    this.store.set(id, {
      ...existing,
      ...patch,
    });
  }
}
