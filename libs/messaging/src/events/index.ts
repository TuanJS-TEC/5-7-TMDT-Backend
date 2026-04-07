/** Integration event names for RabbitMQ routing */
export const LISTING_EVENTS = {
  CREATED: 'listing.created',
  APPROVED: 'listing.approved',
  /** UC16 A1 — admin từ chối / huỷ bài đăng */
  REJECTED: 'listing.rejected',
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
