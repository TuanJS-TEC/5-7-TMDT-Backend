export interface ReportRecord {
  id: string;
  /** Backward-compatible field for UC10 listing report */
  listingId?: string;
  reporterId: string;
  reason: string;
  description: string;
  targetType: 'listing' | 'account';
  targetId: string;
  status: string;
  evidenceImages?: string[];
  evidenceMessages?: string[];
  evidenceVideos?: string[];
  processedBy?: string;
  processedAt?: string;
  processedAction?: 'warn_account' | 'lock_account' | 'remove_all_listings' | 'ignore';
  processedNote?: string;
  actionExecutionStatus?: 'deferred_to_uc36_uc37_uc38' | 'ignored' | 'completed';
  notificationPrimaryChannel?: 'email' | 'in_app';
  notificationFinalChannel?: 'email' | 'in_app';
  notificationFallbackUsed?: boolean;
  createdAt: string; // ISO string
}
