export type ReportReason = 'spam' | 'scam' | 'offensive' | 'wrong_info' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export class ListingReport {
  constructor(
    public readonly id: string,
    public readonly listingId: string,
    public readonly reporterId: string,
    public readonly reason: ReportReason,
    public readonly description: string,
    public status: ReportStatus,
    public readonly createdAt: Date,
  ) {}

  resolve(): void {
    this.status = 'resolved';
  }

  dismiss(): void {
    this.status = 'dismissed';
  }
}
