import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { ReportReadRepository } from '../../infrastructure/persistence/read/report.read.repository';
import { ReportWriteRepository } from '../../infrastructure/persistence/write/report.write.repository';
import { ProfileService } from '../../infrastructure/auth/profile.service';
import { ReportModerationAction } from '../../domain/types/report-moderation-action.type';
import { ReportNotificationService } from './report-notification.service';

interface ProcessReportInput {
  moderatorId: string;
  action: ReportModerationAction;
  note?: string;
}

@Injectable()
export class ReportModerationService {
  constructor(
    private readonly reportReadRepository: ReportReadRepository,
    private readonly reportWriteRepository: ReportWriteRepository,
    private readonly listingReadRepository: ListingReadRepository,
    private readonly profileService: ProfileService,
    private readonly reportNotificationService: ReportNotificationService,
  ) {}

  async listReports(status?: 'pending' | 'processed') {
    const reports = status
      ? await this.reportReadRepository.findByStatus(status)
      : await this.reportReadRepository.findAll();

    const sorted = [...reports].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return {
      total: sorted.length,
      items: sorted,
    };
  }

  async getReportDetail(reportId: string) {
    const report = await this.reportReadRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException('Khong tim thay bao cao vi pham');
    }

    const reporter = await this.profileService.getPublicSellerProfile(report.reporterId);

    let targetDetails: unknown = null;
    if (report.targetType === 'listing') {
      targetDetails = await this.listingReadRepository.findById(report.targetId);
    } else {
      targetDetails = await this.profileService.getPublicSellerProfile(report.targetId);
    }

    return {
      ...report,
      reporter: reporter ?? { id: report.reporterId },
      targetDetails,
      evidence: {
        images: report.evidenceImages ?? [],
        messages: report.evidenceMessages ?? [],
        videos: report.evidenceVideos ?? [],
      },
    };
  }

  async processReport(reportId: string, dto: ProcessReportInput) {
    const report = await this.reportReadRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException('Khong tim thay bao cao vi pham');
    }

    if (report.status !== 'pending') {
      throw new BadRequestException('Bao cao da duoc xu ly truoc do');
    }

    const executionStatus = this.determineExecutionStatus(dto.action);
    const notification = await this.reportNotificationService.notifyModerationDecision({
      reportId,
      targetType: report.targetType,
      targetId: report.targetId,
      action: dto.action,
      note: dto.note,
    });

    await this.reportWriteRepository.update(reportId, {
      status: 'processed',
      processedBy: dto.moderatorId,
      processedAt: new Date().toISOString(),
      processedAction: dto.action,
      processedNote: dto.note,
      actionExecutionStatus: executionStatus,
      notificationPrimaryChannel: notification.primaryChannel,
      notificationFinalChannel: notification.finalChannel,
      notificationFallbackUsed: notification.fallbackUsed,
    });

    const updated = await this.reportReadRepository.findById(reportId);

    return {
      report: updated,
      notification,
      enforcement: {
        action: dto.action,
        executionStatus,
      },
    };
  }

  private determineExecutionStatus(action: ProcessReportInput['action']) {
    switch (action) {
      case 'ignore':
        return 'ignored' as const;
      case 'warn_account':
      case 'lock_account':
      case 'remove_all_listings':
        // TODO(UC36/UC37/UC38): Ket noi enforcement service de thi hanh hanh dong thuc te.
        return 'deferred_to_uc36_uc37_uc38' as const;
      default:
        throw new BadRequestException('Hanh dong xu ly khong hop le');
    }
  }
}
