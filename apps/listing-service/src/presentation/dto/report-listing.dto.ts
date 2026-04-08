import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import type { ReportReason } from '../../domain/entities/report.entity';

export class ReportListingDto {
  @IsEnum(['spam', 'scam', 'offensive', 'wrong_info', 'other'] as ReportReason[])
  @IsNotEmpty()
  reason: ReportReason;

  @IsString()
  @IsNotEmpty()
  description: string;
}
