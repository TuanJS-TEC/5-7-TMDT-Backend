import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import type { ReportRecord } from '../../infrastructure/persistence/report-record';
import { SellerWarningWriteRepository } from '../../infrastructure/persistence/write/seller-warning.write.repository';
import type { SellerWarningRecord } from '../../infrastructure/persistence/seller-warning-record';
import { NotificationHttpClient } from '../../infrastructure/notifications/notification-http.client';
import {
  SELLER_WARNING_TYPE_LABELS,
  type SellerWarningType,
} from '../../domain/types/seller-warning-type.type';
import { v4 as uuidv4 } from 'uuid';

export interface WarnAccountInput {
  report: ReportRecord;
  moderatorId: string;
  warningType?: SellerWarningType;
  note?: string;
}

@Injectable()
export class SellerWarningService {
  constructor(
    private readonly listingReadRepository: ListingReadRepository,
    private readonly sellerWarningWriteRepository: SellerWarningWriteRepository,
    private readonly notificationHttpClient: NotificationHttpClient,
  ) {}

  async resolveSellerUserId(report: ReportRecord): Promise<string> {
    if (report.targetType === 'account') {
      return report.targetId;
    }
    const listing = await this.listingReadRepository.findById(report.targetId);
    if (!listing) {
      throw new NotFoundException('Khong tim thay tin dang lien quan bao cao');
    }
    return listing.sellerId;
  }

  private buildCopy(input: WarnAccountInput): { title: string; body: string } {
    const typeKey = input.warningType;
    const typeLabel = typeKey
      ? SELLER_WARNING_TYPE_LABELS[typeKey]
      : undefined;
    const note = input.note?.trim() ?? '';
    if (!typeLabel && !note) {
      throw new BadRequestException({
        code: 'UC36_WARNING_CONTENT_REQUIRED',
        message:
          'Can nhap loai canh bao hoac noi dung chi tiet (gom trong note) khi gui canh bao.',
      });
    }
    const title = 'Canh bao vi pham tu Ban quan tri';
    const parts: string[] = [];
    if (typeLabel) {
      parts.push(`Loai: ${typeLabel}.`);
    }
    if (note) {
      parts.push(note);
    } else if (typeLabel) {
      parts.push(
        'Tai khoan cua ban co dau hieu vi pham. Vui long dieu chinh hanh vi de tranh bien phap man hon.',
      );
    }
    const body = parts.join(' ');
    return { title, body };
  }

  /**
   * UC36: gui canh bao qua UC60, sau do ghi lich su.
   */
  async sendOfficialWarningAndRecord(
    input: WarnAccountInput,
  ): Promise<{
    warning: SellerWarningRecord;
    notification: {
      primaryChannel: string;
      finalChannel: string;
      fallbackUsed: boolean;
    };
  }> {
    const { title, body } = this.buildCopy(input);
    const sellerUserId = await this.resolveSellerUserId(input.report);

    const dispatch = await this.notificationHttpClient.sendSellerWarning({
      recipientUserId: sellerUserId,
      reportId: input.report.id,
      warningType: input.warningType,
      title,
      body,
    });

    if (!dispatch.success) {
      throw new BadRequestException({
        code: 'UC36_NOTIFICATION_FAILED',
        message:
          'He thong khong gui duoc thong bao canh bao qua bat ky kenh nao (UC36 ket thuc that bai).',
      });
    }

    const record: SellerWarningRecord = {
      id: uuidv4(),
      sellerUserId,
      reportId: input.report.id,
      moderatorId: input.moderatorId,
      warningType: input.warningType,
      moderatorNote: input.note?.trim() || undefined,
      title,
      body,
      notificationPrimaryChannel: dispatch.primaryChannel,
      notificationFinalChannel: dispatch.finalChannel,
      notificationFallbackUsed: dispatch.fallbackUsed,
      createdAt: new Date().toISOString(),
    };

    await this.sellerWarningWriteRepository.save(record);

    return {
      warning: record,
      notification: {
        primaryChannel: dispatch.primaryChannel,
        finalChannel: dispatch.finalChannel,
        fallbackUsed: dispatch.fallbackUsed,
      },
    };
  }
}
