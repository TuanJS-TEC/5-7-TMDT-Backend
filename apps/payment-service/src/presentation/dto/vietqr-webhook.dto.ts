import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/** UC31 — Payload cổng thanh toán POST webhook (chuẩn hóa cho VietQR / ngân hàng) */
export class VietQrWebhookDto {
  @IsString()
  order_id: string;

  @IsString()
  transaction_id: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  status: string;

  /** ISO-8601 hoặc chuỗi do cổng quy định — phải khớp khi ký */
  @IsString()
  timestamp: string;

  @IsString()
  signature: string;

  @IsOptional()
  @IsString()
  transfer_content?: string;
}
