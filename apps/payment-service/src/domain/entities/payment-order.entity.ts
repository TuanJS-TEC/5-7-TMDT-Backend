import type { PaymentMethodType } from '../value-objects/payment-method.value-object';

export type PaymentOrderStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  /** UC28 A3 — số tiền webhook khác đơn PENDING */
  | 'amount_mismatch'
  /** UC28 A4 / timeout không webhook */
  | 'expired'
  /** UC28 A2 — nội dung CK không khớp order_id, chờ xử lý thủ công */
  | 'pending_manual_review'
  /** UC34 — đã hoàn tiền qua cổng */
  | 'refunded';

export class PaymentOrder {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly listingPackageType: string,
    public readonly listingId: string | null,
    public readonly paymentMethod: PaymentMethodType,
    public readonly amountVnd: number,
    public status: PaymentOrderStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public transactionId?: string,
    public errorMessage?: string,
  ) {}

  markAsSuccess(transactionId: string): void {
    this.status = 'success';
    this.transactionId = transactionId;
    this.updatedAt = new Date();
  }

  markAsFailed(errorMsg: string): void {
    this.status = 'failed';
    this.errorMessage = errorMsg;
    this.updatedAt = new Date();
  }
}
