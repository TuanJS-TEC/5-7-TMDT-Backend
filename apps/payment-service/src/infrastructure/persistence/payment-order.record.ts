import type { PaymentOrderStatus } from '../../domain/entities/payment-order.entity';
import type { PaymentMethodType } from '../../domain/value-objects/payment-method.value-object';

export interface PaymentOrderRecord {
  id: string;
  userId: string;
  listingPackageType: string;
  paymentMethod: PaymentMethodType;
  amountVnd: number;
  status: PaymentOrderStatus;
  createdAt: Date;
  updatedAt: Date;
  transactionId?: string;
  errorMessage?: string;
}
