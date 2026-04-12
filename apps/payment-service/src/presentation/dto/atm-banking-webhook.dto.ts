import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/** UC30 — IPN cổng ATM/Internet Banking (demo hoặc VNPay/PayOS thật sau này) */
export class AtmBankingWebhookDto {
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @IsString()
  @IsNotEmpty()
  transaction_no!: string;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  /** VNPay-style: "00" = thành công */
  @IsString()
  @IsNotEmpty()
  response_code!: string;

  @IsString()
  @IsNotEmpty()
  bank_code!: string;

  @IsString()
  message!: string;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsString()
  @IsNotEmpty()
  secure_hash!: string;
}
