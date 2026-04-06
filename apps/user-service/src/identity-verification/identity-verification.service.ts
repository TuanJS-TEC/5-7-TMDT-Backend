import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdentityVerificationMockStore } from './identity-verification.mock-store';
import type {
  MockUser,
  VerificationRequest,
  VerificationStatus,
} from './identity-verification.types';
import type { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';
import type {
  ApproveIdentityVerificationDto,
  RejectIdentityVerificationDto,
} from './dto/review-identity-verification.dto';

@Injectable()
export class IdentityVerificationService {
  constructor(private readonly store: IdentityVerificationMockStore) {}

  submitRequest(dto: SubmitIdentityVerificationDto) {
    const user = this.store.users.get(dto.userId);
    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung trong mock data');
    }

    if (!dto.idImageUrl || !dto.idImageUrl.trim()) {
      throw new BadRequestException('idImageUrl la bat buoc');
    }

    const requestId = this.store.nextRequestId();

    const request: VerificationRequest = {
      id: requestId,
      userId: dto.userId,
      documentType: dto.documentType ?? 'cccd',
      idImageUrl: dto.idImageUrl.trim(),
      aiCheckStatus: this.mockAiCheck(),
      status: 'pending_admin_review',
      submittedAt: new Date().toISOString(),
    };

    this.store.requests.set(requestId, request);
    this.updateUserStatusAfterSubmit(user, requestId);

    return {
      message: 'Da tiep nhan yeu cau xac thuc CCCD/CMND',
      data: request,
    };
  }

  listRequests(status?: VerificationStatus) {
    const requests = Array.from(this.store.requests.values()).filter((item) =>
      status ? item.status === status : true,
    );

    return {
      total: requests.length,
      data: requests,
    };
  }

  approveRequest(
    requestId: string,
    dto: ApproveIdentityVerificationDto,
  ) {
    if (!dto.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }

    const request = this.store.requests.get(requestId);
    if (!request) {
      throw new NotFoundException('Khong tim thay yeu cau xac thuc');
    }

    const user = this.getUserOrThrow(request.userId);

    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = dto.adminId.trim();
    request.adminNote = dto.note?.trim() || 'Da phe duyet';

    user.canSell = true;
    user.verificationStatus = 'approved';
    user.latestRequestId = request.id;

    return {
      message: 'Da phe duyet xac thuc thanh cong',
      data: request,
    };
  }

  rejectRequest(
    requestId: string,
    dto: RejectIdentityVerificationDto,
  ) {
    if (!dto.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('reason la bat buoc');
    }

    const request = this.store.requests.get(requestId);
    if (!request) {
      throw new NotFoundException('Khong tim thay yeu cau xac thuc');
    }

    const user = this.getUserOrThrow(request.userId);

    request.status = 'rejected';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = dto.adminId.trim();
    request.rejectionReason = dto.reason.trim();

    user.canSell = false;
    user.verificationStatus = 'rejected';
    user.latestRequestId = request.id;

    return {
      message: 'Da tu choi yeu cau xac thuc',
      data: request,
    };
  }

  getCanSellStatus(userId: string) {
    const user = this.getUserOrThrow(userId);

    return {
      userId: user.id,
      fullName: user.fullName,
      canSell: user.canSell,
      verificationStatus: user.verificationStatus,
      latestRequestId: user.latestRequestId ?? null,
      message: user.canSell
        ? 'Da duoc xac thuc, co the dang ban xe'
        : 'Chua duoc xac thuc, khong the dang ban xe',
    };
  }

  listMockUsers() {
    return {
      total: this.store.users.size,
      data: Array.from(this.store.users.values()),
    };
  }

  private getUserOrThrow(userId: string): MockUser {
    const user = this.store.users.get(userId);
    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung trong mock data');
    }
    return user;
  }

  private updateUserStatusAfterSubmit(user: MockUser, requestId: string) {
    user.verificationStatus = 'pending_admin_review';
    user.canSell = false;
    user.latestRequestId = requestId;
  }

  private mockAiCheck(): 'passed' {
    // TODO: Tich hop AI service sau. Hien tai tam thoi AUTO PASS theo yeu cau.
    return 'passed';
  }
}
