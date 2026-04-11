/** UC34 — payload queue `payment.refund.completed` (payment-service → consumers) */
export type RefundCompletedPayload = {
  refundId: string;
  orderId: string;
  userId: string;
  amountVnd: number;
  originalTransactionId: string;
  listingId: string | null;
  listingPackageType: string;
  refundedAt: string;
};
