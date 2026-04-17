export interface ReportRecord {
  id: string;
  listingId?: string; // Có thể optional nếu dùng targetId
  targetType: 'listing' | 'account';
  targetId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: string;
  evidenceImages?: string[];
  evidenceMessages?: string[];
  evidenceVideos?: string[];
  processedBy?: string;
  processedAt?: string;
  processedAction?: string;
  processedNote?: string;
  actionExecutionStatus?: string;
  notificationPrimaryChannel?: string;
  notificationFinalChannel?: string;
  notificationFallbackUsed?: boolean;
  createdAt: string; // ISO string
}
