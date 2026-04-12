export type Uc38RemovalSource =
  | 'uc37_account_lock'
  | 'uc38_report_moderation'
  | 'uc38_admin_api';

export interface Uc38RemovalAuditRecord {
  id: string;
  sellerId: string;
  moderatorId: string;
  source: Uc38RemovalSource;
  /** Danh sách tin `approved` đã chuyển sang `removed` */
  listingIds: string[];
  reportId?: string;
  note?: string;
  createdAt: string;
}
