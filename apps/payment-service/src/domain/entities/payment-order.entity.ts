import type { PaymentMethodType } from '../value-objects/payment-method.value-object';

export type PaymentOrderStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export class PaymentOrder {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly listingPackageType: string,
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
