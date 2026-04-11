import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  REPORT_MODERATION_ACTIONS,
  type ReportModerationAction,
} from '../../domain/types/report-moderation-action.type';

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
}
