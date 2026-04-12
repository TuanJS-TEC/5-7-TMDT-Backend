import { IsString, IsNumber, IsNotEmpty, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { PaymentMethodType } from '../../domain/value-objects/payment-method.value-object';

const PAYMENT_METHODS: PaymentMethodType[] = [
  'bank_transfer',
  'qr_banking',
  'momo',
  'vnpay',
  'zalopay',
  'credit_card',
  'atm_internet_banking',
];

export class CreatePaymentOrderDto {
  @IsString()
  @IsNotEmpty()
  listingPackageType: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethodType;

  @IsNumber()
  @IsNotEmpty()
  amountVnd: number;

  /** Tin đăng cần áp gói sau khi thanh toán (khuyến nghị cho UC28) */
  @IsOptional()
  @IsUUID()
  listingId?: string;
}
