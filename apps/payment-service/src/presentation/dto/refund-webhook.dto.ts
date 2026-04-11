import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/** UC34 bước 3 — callback từ cổng sau khi xử lý hoàn tiền (async / tích hợp thật). */
export class RefundWebhookDto {
  @IsUUID()
  refundId!: string;

  @IsUUID()
  paymentOrderId!: string;

  @IsIn(['success', 'failed'])
  status!: 'success' | 'failed';

  @IsInt()
  @Min(1)
  amountVnd!: number;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsOptional()
  @IsString()
  gatewayRefundReference?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}
