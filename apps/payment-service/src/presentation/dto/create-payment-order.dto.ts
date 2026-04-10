import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import type { PaymentMethodType } from '../../domain/value-objects/payment-method.value-object';

export class CreatePaymentOrderDto {
  @IsString()
  @IsNotEmpty()
  listingPackageType: string;

  @IsString()
  @IsNotEmpty()
  // Ở một tình huống thực tế, chúng ta sẽ validate enum
  paymentMethod: PaymentMethodType;

  @IsNumber()
  @IsNotEmpty()
  amountVnd: number;
}
