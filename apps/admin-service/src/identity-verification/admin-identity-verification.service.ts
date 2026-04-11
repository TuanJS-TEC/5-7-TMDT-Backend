import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class AdminIdentityVerificationService {
  private readonly userServiceBaseUrl =
    process.env.USER_SERVICE_BASE_URL ?? 'http://localhost:3004';

  async getPendingRequests() {
    return this.callUserService(
      '/identity-verification/admin/requests?status=pending_admin_review',
      {
        method: 'GET',
      },
    );
  }

  async approveRequest(requestId: string, adminId: string, note?: string) {
    return this.callUserService(
      `/identity-verification/admin/requests/${requestId}/approve`,
      {
        method: 'PATCH',
        body: JSON.stringify({ adminId, note }),
      },
    );
  }

  async rejectRequest(requestId: string, adminId: string, reason: string) {
    return this.callUserService(
      `/identity-verification/admin/requests/${requestId}/reject`,
      {
        method: 'PATCH',
        body: JSON.stringify({ adminId, reason }),
      },
    );
  }

  private async callUserService(path: string, init: RequestInit) {
    try {
      const response = await fetch(`${this.userServiceBaseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });

      const payload = await this.readJson(response);

      if (!response.ok) {
        const message = payload?.message || 'Loi khi goi user-service';
        throw new HttpException(message, response.status);
      }

      return payload;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Khong the ket noi user-service. Hay kiem tra USER_SERVICE_BASE_URL',
      );
    }
  }

  private async readJson(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new HttpException(
        'Phan hoi tu user-service khong hop le',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
