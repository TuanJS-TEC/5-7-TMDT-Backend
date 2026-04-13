export interface SellerWarningRecord {
  id: string;
  sellerUserId: string;
  reportId: string;
  moderatorId: string;
  warningType?: string;
  moderatorNote?: string;
  title: string;
  body: string;
  notificationPrimaryChannel: string;
  notificationFinalChannel: string;
  notificationFallbackUsed: boolean;
  createdAt: string;
}
