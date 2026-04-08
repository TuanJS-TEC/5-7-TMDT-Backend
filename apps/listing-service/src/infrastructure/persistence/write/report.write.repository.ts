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
}
