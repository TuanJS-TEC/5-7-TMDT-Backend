import { Inject, Injectable } from '@nestjs/common';
import { REPORT_STORE } from '../report.store.token';
import { ReportRecord } from '../report-record';

@Injectable()
export class ReportReadRepository {
  constructor(
    @Inject(REPORT_STORE)
    private readonly store: Map<string, ReportRecord>,
  ) {}

  async findByListingId(listingId: string): Promise<ReportRecord[]> {
    return Array.from(this.store.values()).filter(r => r.listingId === listingId);
  }

  async findAll(): Promise<ReportRecord[]> {
    return Array.from(this.store.values());
  }
}
