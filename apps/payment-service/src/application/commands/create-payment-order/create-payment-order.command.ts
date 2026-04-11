import type { PaymentMethodType } from '../../../domain/value-objects/payment-method.value-object';

export class CreatePaymentOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly listingPackageType: string,
    public readonly paymentMethod: PaymentMethodType,
    public readonly amountVnd: number,
    public readonly listingId: string | null,
  ) {}
}
