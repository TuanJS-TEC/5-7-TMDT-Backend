export type PaymentRefundStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface PaymentRefundRecord {
  id: string;
  paymentOrderId: string;
  originalTransactionId: string;
  amountVnd: number;
  status: PaymentRefundStatus;
  reason: string | null;
  createdByAdminUserId: string;
  gatewayRefundReference: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
