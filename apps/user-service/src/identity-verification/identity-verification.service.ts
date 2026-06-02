import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  VerificationRequest,
  VerificationStatus,
} from './identity-verification.types';
import type { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';
import type {
  ApproveIdentityVerificationDto,
  RejectIdentityVerificationDto,
} from './dto/review-identity-verification.dto';
import { UserEntity } from '../users/user.entity';
import { IdentityVerificationRequestEntity } from './identity-verification-request.entity';

@Injectable()
export class IdentityVerificationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(IdentityVerificationRequestEntity)
    private readonly requests: Repository<IdentityVerificationRequestEntity>,
  ) {}

  async submitRequest(dto: SubmitIdentityVerificationDto) {
    const user = await this.users.findOneBy({ id: dto.userId } as any);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto.idImageUrl || !dto.idImageUrl.trim()) {
      throw new BadRequestException('idImageUrl la bat buoc');
    }

    const request = this.requests.create({
      userId: dto.userId,
      documentType: dto.documentType ?? 'cccd',
      idImageUrl: dto.idImageUrl.trim(),
      aiCheckStatus: this.defaultAiCheckStatus(),
      status: 'pending_admin_review',
    });
    const saved = await this.requests.save(request);
    await this.updateUserStatusAfterSubmit(user, saved.id);

    return {
      message: 'Identity verification request received',
      data: this.toDto(saved),
    };
  }

  async listRequests(status?: VerificationStatus) {
    const where = status ? ({ status } as any) : {};
    const rows = await this.requests.find({
      where,
      order: { createdAt: 'DESC' as any },
    });
    return {
      total: rows.length,
      data: rows.map((row) => this.toDto(row)),
    };
  }

  async approveRequest(
    requestId: string,
    dto: ApproveIdentityVerificationDto,
  ) {
    if (!dto.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }

    const request = await this.requests.findOneBy({ id: requestId } as any);
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const user = await this.getUserOrThrow(request.userId);

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = dto.adminId.trim();
    request.adminNote = dto.note?.trim() || 'Approved';
    request.rejectionReason = null;
    await this.requests.save(request);

    user.canSell = true;
    user.verificationStatus = 'approved';
    user.latestRequestId = request.id;
    await this.users.save(user);

    return {
      message: 'Verification approved successfully',
      data: this.toDto(request),
    };
  }

  async rejectRequest(
    requestId: string,
    dto: RejectIdentityVerificationDto,
  ) {
    if (!dto.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('reason la bat buoc');
    }

    const request = await this.requests.findOneBy({ id: requestId } as any);
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const user = await this.getUserOrThrow(request.userId);

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = dto.adminId.trim();
    request.rejectionReason = dto.reason.trim();
    request.adminNote = null;
    await this.requests.save(request);

    user.canSell = false;
    user.verificationStatus = 'rejected';
    user.latestRequestId = request.id;
    await this.users.save(user);

    return {
      message: 'Verification request rejected',
      data: this.toDto(request),
    };
  }

  async getCanSellStatus(userId: string) {
    const user = await this.getUserOrThrow(userId);

    return {
      userId: user.id,
      fullName: user.fullName,
      canSell: Boolean(user.canSell),
      verificationStatus: (user.verificationStatus ?? 'none') as VerificationStatus,
      latestRequestId: user.latestRequestId ?? null,
      message: user.canSell
        ? 'User is verified and can post listings'
        : 'User is not verified and cannot post listings',
    };
  }

  private async getUserOrThrow(userId: string): Promise<UserEntity> {
    const user = await this.users.findOneBy({ id: userId } as any);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async updateUserStatusAfterSubmit(user: UserEntity, requestId: string): Promise<void> {
    user.verificationStatus = 'pending_admin_review';
    user.canSell = false;
    user.latestRequestId = requestId;
    await this.users.save(user);
  }

  private defaultAiCheckStatus(): 'passed' {
    return 'passed';
  }

  private toDto(request: IdentityVerificationRequestEntity): VerificationRequest {
    return {
      id: request.id,
      userId: request.userId,
      documentType: request.documentType,
      idImageUrl: request.idImageUrl,
      aiCheckStatus: request.aiCheckStatus,
      status: request.status,
      submittedAt: request.createdAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
      reviewedBy: request.reviewedBy ?? undefined,
      adminNote: request.adminNote ?? undefined,
      rejectionReason: request.rejectionReason ?? undefined,
    };
  }
}
