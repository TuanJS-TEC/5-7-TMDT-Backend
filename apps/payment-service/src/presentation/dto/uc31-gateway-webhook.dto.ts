import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * UC31 — Payload chuẩn từ cổng thanh toán (generic).
 * Chữ ký: HMAC-SHA256 hex trên chuỗi
 * order_id|transaction_id|amount|currency|status|timestamp
 */
export class Uc31GatewayWebhookDto {
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @IsString()
  @IsNotEmpty()
  transaction_id!: string;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsString()
  @IsIn(['VND'])
  currency!: 'VND';

  @IsString()
  @IsIn(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;

  /** UC31 A1 — khi status = FAILED */
  @IsOptional()
  @IsString()
  failure_reason?: string;
}
