import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/** UC29 — IPN ví (Demo Sandbox hoặc cổng thật khi tích hợp sau này) */
export class EWalletWebhookDto {
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @IsString()
  @IsNotEmpty()
  trans_id!: string;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @Type(() => Number)
  @IsNumber()
  result_code!: number;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}
