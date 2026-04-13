import { ReportRecord } from './report-record';

export function createMockReportStore(): Map<string, ReportRecord> {
  const store = new Map<string, ReportRecord>();
  return store;
}
