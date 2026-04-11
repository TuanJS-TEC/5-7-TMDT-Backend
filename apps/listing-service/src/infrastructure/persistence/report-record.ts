export interface ReportRecord {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string; // ISO string
}
