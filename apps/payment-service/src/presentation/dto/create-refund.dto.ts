import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  paymentOrderId!: string;

  @IsInt()
  @Min(1)
  amountVnd!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  /** Demo UC34 A1 — mô phỏng cổng từ chối */
  @IsOptional()
  @IsBoolean()
  simulateGatewayReject?: boolean;
}
