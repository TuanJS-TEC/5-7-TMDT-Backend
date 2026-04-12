import { Injectable } from '@nestjs/common';
import { ReportModerationAction } from '../../domain/types/report-moderation-action.type';

export type ModerationNotificationChannel = 'email' | 'in_app';

export interface ReportDecisionNotificationInput {
  reportId: string;
  targetType: 'listing' | 'account';
  targetId: string;
  action: ReportModerationAction;
  note?: string;
}

@Injectable()
export class ReportNotificationService {
  async notifyModerationDecision(input: ReportDecisionNotificationInput): Promise<{
    primaryChannel: ModerationNotificationChannel;
    finalChannel: ModerationNotificationChannel;
    fallbackUsed: boolean;
  }> {
    const primaryChannel = (process.env.REPORT_NOTIFY_PRIMARY as ModerationNotificationChannel) ?? 'email';
    const fallbackChannel = (process.env.REPORT_NOTIFY_FALLBACK as ModerationNotificationChannel) ?? 'in_app';
    const shouldFailPrimary =
      (process.env.REPORT_NOTIFY_SIMULATE_PRIMARY_FAILURE ?? 'false') === 'true';

    // UC35 A1: neu kenh uu tien bi loi, he thong fallback sang kenh thu 2.
    const fallbackUsed = shouldFailPrimary;
    const finalChannel = fallbackUsed ? fallbackChannel : primaryChannel;

    console.log(
      `Mock notify report=${input.reportId} action=${input.action} primary=${primaryChannel} final=${finalChannel}`,
    );

    return {
      primaryChannel,
      finalChannel,
      fallbackUsed,
    };
  }
}
