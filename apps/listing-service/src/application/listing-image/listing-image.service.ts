import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { LISTING_EVENTS } from '@car-marketplace/messaging';
import { ListingWriteRepository } from '../../infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { AiImageValidationClient } from '../../infrastructure/ai/ai-image-validation.client';
import { RabbitMqPublisher } from '../../infrastructure/messaging/rabbitmq.publisher';
const MAX_AI_FAILURES_BEFORE_MANUAL = 5;

@Injectable()
export class ListingImageService {
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly readRepo: ListingReadRepository,
    private readonly aiClient: AiImageValidationClient,
    private readonly publisher: RabbitMqPublisher,
    private readonly config: ConfigService,
  ) {}

  private skipAiValidation(): boolean {
    return this.config.get<string>('SKIP_AI_IMAGE_VALIDATION', 'true') === 'true';
  }

  /** UC17 — link & field để client upload (multipart) */
  getUploadInstructions(listingId: string, publicBaseUrl: string) {
    const base = publicBaseUrl.replace(/\/$/, '');
    return {
      uploadUrl: `${base}/api/v1/listings/${listingId}/images`,
      method: 'POST' as const,
      contentType: 'multipart/form-data',
      formFields: {
        sellerId: 'uuid — bắt buộc, phải trùng chủ bài đăng',
        file: 'file ảnh (JPEG/PNG)',
      },
    };
  }

  /** Danh sách bài đăng có ảnh chờ QTV (UC17 A1) */
  async listPendingManualReviews() {
    const all = await this.readRepo.findAllRecords();
    return all
      .filter((r) => r.manualImageReviewRequested === true)
      .map((r) => ({
        id: r.id,
        sellerId: r.sellerId,
        title: r.title,
        pendingManualReviewImageUrl: r.pendingManualReviewImageUrl,
        imageAiFailureCount: r.imageAiFailureCount,
      }));
  }

  async uploadAndValidate(
    listingId: string,
    sellerId: string,
    file: Express.Multer.File,
  ) {
    const listing = await this.writeRepo.findById(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Not the owner of this listing');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException({
        code: 'IMAGE_REQUIRED',
        message: 'Vui lòng gửi file ảnh (field: file).',
      });
    }

    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_IMAGE_TYPE',
        message: 'Chỉ chấp nhận JPEG hoặc PNG.',
      });
    }

    const jpegBuffer = await sharp(file.buffer)
      .rotate()
      .jpeg({ quality: 88 })
      .toBuffer();

    const ai = this.skipAiValidation()
      ? { valid: true as const }
      : await this.aiClient.validateImage(jpegBuffer, 'image/jpeg');

    if (ai.valid) {
      const rel = await this.persistApprovedImage(listingId, jpegBuffer);
      const urls = [...(listing.imageUrls ?? []), rel];
      await this.writeRepo.update(listingId, {
        imageUrls: urls,
        imageAiFailureCount: 0,
        manualImageReviewRequested: false,
        pendingManualReviewImageUrl: undefined,
        imageModerationState: 'none',
      });
      await this.publisher.publish(LISTING_EVENTS.IMAGE_VALIDATED, {
        listingId,
        sellerId,
        imageUrl: rel,
      });
      return {
        ok: true as const,
        imageUrl: rel,
        imageAiFailureCount: 0,
        requiresManualReview: false,
      };
    }

    const failures = (listing.imageAiFailureCount ?? 0) + 1;

    if (failures < MAX_AI_FAILURES_BEFORE_MANUAL) {
      await this.writeRepo.update(listingId, { imageAiFailureCount: failures });
      await this.publisher.publish(LISTING_EVENTS.IMAGE_REJECTED_BY_AI, {
        listingId,
        sellerId,
        imageAiFailureCount: failures,
        reason: ai.reason,
      });
      throw new BadRequestException({
        code: 'IMAGE_REJECTED_BY_AI',
        message: 'Ảnh không đạt kiểm tra tự động.',
        reason: ai.reason,
        imageAiFailureCount: failures,
      });
    }

    const pendingRel = await this.persistPendingReviewImage(
      listingId,
      jpegBuffer,
    );
    await this.writeRepo.update(listingId, {
      imageAiFailureCount: failures,
      manualImageReviewRequested: true,
      pendingManualReviewImageUrl: pendingRel,
      imageModerationState: 'pending_manual_review',
    });
    await this.publisher.publish(LISTING_EVENTS.IMAGE_REJECTED_BY_AI, {
      listingId,
      sellerId,
      imageAiFailureCount: failures,
      reason: ai.reason,
    });
    await this.publisher.publish(LISTING_EVENTS.IMAGE_MANUAL_REVIEW_REQUIRED, {
      listingId,
      sellerId,
      imageAiFailureCount: failures,
      pendingManualReviewImageUrl: pendingRel,
    });

    return {
      ok: false as const,
      requiresManualReview: true,
      imageAiFailureCount: failures,
      pendingManualReviewImageUrl: pendingRel,
      message:
        'Đã đạt ngưỡng kiểm tra tự động. Bài đăng được chuyển cho quản trị viên xem ảnh thủ công.',
      lastRejectionReason: ai.reason,
    };
  }

  /** UC17 A1 — QTV duyệt / từ chối ảnh chờ */
  async manualReview(
    listingId: string,
    moderatorId: string,
    approve: boolean,
    rejectListing?: boolean,
  ) {
    const listing = await this.writeRepo.findById(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (!listing.manualImageReviewRequested || !listing.pendingManualReviewImageUrl) {
      throw new BadRequestException({
        code: 'NO_PENDING_IMAGE_REVIEW',
        message: 'Bài đăng không có ảnh chờ duyệt thủ công.',
      });
    }

    const diskPath = this.diskPathFromPublicUrl(listing.pendingManualReviewImageUrl);

    if (approve) {
      const finalName = `${uuidv4()}.jpg`;
      const finalRel = `/uploads/listings/${listingId}/${finalName}`;
      const finalDisk = join(
        process.cwd(),
        'uploads',
        'listings',
        listingId,
        finalName,
      );
      await fs.rename(diskPath, finalDisk).catch(async () => {
        await fs.copyFile(diskPath, finalDisk);
        await fs.unlink(diskPath).catch(() => undefined);
      });

      await this.writeRepo.update(listingId, {
        imageUrls: [...(listing.imageUrls ?? []), finalRel],
        imageAiFailureCount: 0,
        manualImageReviewRequested: false,
        pendingManualReviewImageUrl: undefined,
        imageModerationState: 'none',
      });
      await this.publisher.publish(LISTING_EVENTS.IMAGE_MANUAL_REVIEW_DECIDED, {
        listingId,
        moderatorId,
        decision: 'approved',
        imageUrl: finalRel,
      });
      return { ok: true as const, decision: 'approved' as const, imageUrl: finalRel };
    }

    await fs.unlink(diskPath).catch(() => undefined);
    const patch: Parameters<ListingWriteRepository['update']>[1] = {
      manualImageReviewRequested: false,
      pendingManualReviewImageUrl: undefined,
      imageModerationState: 'none',
      imageAiFailureCount: 0,
    };
    if (rejectListing) {
      patch.status = 'rejected';
    }
    await this.writeRepo.update(listingId, patch);
    await this.publisher.publish(LISTING_EVENTS.IMAGE_MANUAL_REVIEW_DECIDED, {
      listingId,
      moderatorId,
      decision: 'rejected',
      listingRejected: Boolean(rejectListing),
    });
    return {
      ok: true as const,
      decision: 'rejected' as const,
      listingRejected: Boolean(rejectListing),
    };
  }

  private diskPathFromPublicUrl(publicUrl: string): string {
    const relative = publicUrl.replace(/^\//, '');
    return join(process.cwd(), relative);
  }

  private async persistApprovedImage(
    listingId: string,
    jpegBuffer: Buffer,
  ): Promise<string> {
    const dir = join(process.cwd(), 'uploads', 'listings', listingId);
    await fs.mkdir(dir, { recursive: true });
    const name = `${uuidv4()}.jpg`;
    await fs.writeFile(join(dir, name), jpegBuffer);
    return `/uploads/listings/${listingId}/${name}`;
  }

  private async persistPendingReviewImage(
    listingId: string,
    jpegBuffer: Buffer,
  ): Promise<string> {
    const dir = join(process.cwd(), 'uploads', 'listings', listingId);
    await fs.mkdir(dir, { recursive: true });
    const name = 'pending-review.jpg';
    await fs.writeFile(join(dir, name), jpegBuffer);
    return `/uploads/listings/${listingId}/${name}`;
  }
}
