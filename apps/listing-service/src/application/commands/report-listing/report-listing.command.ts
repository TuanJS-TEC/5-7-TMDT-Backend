import { ReportReason } from '../../../domain/entities/report.entity';

export class ReportListingCommand {
  constructor(
    public readonly listingId: string,
    public readonly reporterId: string,
    public readonly reason: ReportReason,
    public readonly description: string,
  ) {}
}
