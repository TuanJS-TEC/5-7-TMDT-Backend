import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  REPORT_MODERATION_ACTIONS,
  type ReportModerationAction,
} from '../../domain/types/report-moderation-action.type';
import {
  SELLER_WARNING_TYPES,
  type SellerWarningType,
} from '../../domain/types/seller-warning-type.type';

export const REPORT_PROCESS_ACTIONS = REPORT_MODERATION_ACTIONS;
export type ReportProcessAction = ReportModerationAction;

export class ProcessReportDto {
  @IsUUID()
  moderatorId!: string;

  @IsIn(REPORT_PROCESS_ACTIONS)
  action!: ReportProcessAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** UC36 — khi action = warn_account */
  @IsOptional()
  @IsIn(SELLER_WARNING_TYPES)
  warningType?: SellerWarningType;

  /** UC37 — thời điểm hết hạn khóa (ISO 8601), khi action = lock_account */
  @IsOptional()
  @IsDateString()
  lockUntil?: string;
}
