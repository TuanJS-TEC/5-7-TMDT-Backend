import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { ReportReadRepository } from '../../infrastructure/persistence/read/report.read.repository';
import { ReportWriteRepository } from '../../infrastructure/persistence/write/report.write.repository';
import { ProfileService } from '../../infrastructure/auth/profile.service';
import { ReportModerationAction } from '../../domain/types/report-moderation-action.type';
import type { SellerWarningType } from '../../domain/types/seller-warning-type.type';
import { ReportNotificationService } from './report-notification.service';
import { SellerWarningService } from './seller-warning.service';
import { AccountLockService } from './account-lock.service';
import { SellerListingsRemovalService } from './seller-listings-removal.service';

interface ProcessReportInput {
  moderatorId: string;
  action: ReportModerationAction;
  note?: string;
  warningType?: SellerWarningType;
  lockUntil?: string;
}

@Injectable()
export class ReportModerationService {
  constructor(
    private readonly reportReadRepository: ReportReadRepository,
    private readonly reportWriteRepository: ReportWriteRepository,
    private readonly listingReadRepository: ListingReadRepository,
    private readonly profileService: ProfileService,
    private readonly reportNotificationService: ReportNotificationService,
    private readonly sellerWarningService: SellerWarningService,
    private readonly accountLockService: AccountLockService,
    private readonly sellerListingsRemovalService: SellerListingsRemovalService,
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

    if (dto.action === 'warn_account') {
      const { warning, notification } =
        await this.sellerWarningService.sendOfficialWarningAndRecord({
          report,
          moderatorId: dto.moderatorId,
          warningType: dto.warningType,
          note: dto.note,
        });

      const executionStatus = 'warning_sent' as const;

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
        notification: {
          primaryChannel: notification.primaryChannel,
          finalChannel: notification.finalChannel,
          fallbackUsed: notification.fallbackUsed,
        },
        enforcement: {
          action: dto.action,
          executionStatus,
        },
        uc36: {
          warningId: warning.id,
          sellerUserId: warning.sellerUserId,
        },
      };
    }

    if (dto.action === 'lock_account') {
      const reason = dto.note?.trim();
      if (!reason) {
        throw new BadRequestException({
          code: 'UC37_LOCK_REASON_REQUIRED',
          message:
            'Can nhap ly do khoa tai khoan (truong note) khi chon lock_account.',
        });
      }

      const uc37 = await this.accountLockService.lockAccountForReport(report, {
        moderatorId: dto.moderatorId,
        reason,
        lockUntil: dto.lockUntil,
      });

      const executionStatus = 'account_locked' as const;

      await this.reportWriteRepository.update(reportId, {
        status: 'processed',
        processedBy: dto.moderatorId,
        processedAt: new Date().toISOString(),
        processedAction: dto.action,
        processedNote: dto.note,
        actionExecutionStatus: executionStatus,
        notificationPrimaryChannel: uc37.notification.primaryChannel,
        notificationFinalChannel: uc37.notification.finalChannel,
        notificationFallbackUsed: uc37.notification.fallbackUsed,
      });

      const updated = await this.reportReadRepository.findById(reportId);

      return {
        report: updated,
        notification: {
          primaryChannel: uc37.notification.primaryChannel,
          finalChannel: uc37.notification.finalChannel,
          fallbackUsed: uc37.notification.fallbackUsed,
        },
        enforcement: {
          action: dto.action,
          executionStatus,
        },
        uc37: {
          lockedUserId: uc37.userId,
          role: uc37.role,
          listingsRemoved: uc37.listingsRemoved,
        },
      };
    }

    if (dto.action === 'remove_all_listings') {
      const sellerId = await this.sellerWarningService.resolveSellerUserId(report);
      const uc38 = await this.sellerListingsRemovalService.removeAllActiveListings(
        sellerId,
        {
          moderatorId: dto.moderatorId,
          note: dto.note,
          reportId: report.id,
          source: 'uc38_report_moderation',
        },
      );

      const notification = await this.reportNotificationService.notifyModerationDecision({
        reportId,
        targetType: report.targetType,
        targetId: report.targetId,
        action: dto.action,
        note: dto.note,
      });

      const executionStatus = uc38.empty
        ? ('listings_removal_no_active' as const)
        : ('listings_removed' as const);

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
        uc38: {
          auditId: uc38.auditId,
          sellerId: uc38.sellerId,
          listingIds: uc38.listingIds,
          count: uc38.count,
          empty: uc38.empty,
          message: uc38.message,
        },
      };
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
      default:
        throw new BadRequestException('Hanh dong xu ly khong hop le');
    }
  }
}
