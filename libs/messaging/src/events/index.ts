export * from './payment-payloads';
export * from './listing-payloads';

/** Integration event names for RabbitMQ routing */
export const LISTING_EVENTS = {
  CREATED: 'listing.created',
  APPROVED: 'listing.approved',
  /** UC16 A1 — admin từ chối / huỷ bài đăng */
  REJECTED: 'listing.rejected',
  /** UC25 — showroom đánh dấu tin đã bán */
  SOLD: 'listing.sold',
  DELETED: 'listing.deleted',
  /** UC17 — ảnh đạt qua AI */
  IMAGE_VALIDATED: 'listing.image.validated',
  /** UC17 — ảnh bị AI từ chối */
  IMAGE_REJECTED_BY_AI: 'listing.image.rejected_by_ai',
  /** UC17 — sau 5 lần thất bại, cần quản trị viên */
  IMAGE_MANUAL_REVIEW_REQUIRED: 'listing.image.manual_review_required',
  /** UC17 — quyết định thủ công */
  IMAGE_MANUAL_REVIEW_DECIDED: 'listing.image.manual_review_decided',
} as const;

/** UC28/UC31 — sự kiện thanh toán (payment-service → listing-service, …) */
export const PAYMENT_EVENTS = {
  /** Hàng đợi RabbitMQ: thanh toán gói tin thành công → kích hoạt package trên tin */
  LISTING_PACKAGE_PAID: 'payment.listing_package.paid',
  /**
   * UC34 — hoàn tiền thành công → UC60 (notification-service).
   * Payload giống REFUND_COMPLETED_LISTING; tách queue để nhiều subscriber không tranh message.
   */
  REFUND_COMPLETED: 'payment.refund.completed',
  /** UC34 — cùng payload; queue riêng cho listing-service thu hồi gói tin */
  REFUND_COMPLETED_LISTING: 'payment.refund.completed.listing',
} as const;
