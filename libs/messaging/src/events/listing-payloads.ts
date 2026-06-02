/** UC33 — payload queue `listing.modification_requested` */
export type ListingModificationRequestedPayload = {
  listingId: string;
  sellerId: string;
  moderatorId: string;
  details: string;
  requestedAt: string;
};

/** UC25 — payload queue `listing.sold` (listing-service → notification-service) */
export type ListingSoldPayload = {
  listingId: string;
  sellerId: string;
  title: string;
  soldAt: string;
  /** Người mua đã lưu yêu thích tin này */
  favoriteUserIds: string[];
  /** Admin nhận thông báo (từ env NOTIFICATION_ADMIN_USER_IDS) */
  adminUserIds: string[];
};
