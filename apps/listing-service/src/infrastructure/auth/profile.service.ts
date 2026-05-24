import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface PublicSellerProfileDto {
  id: string;
  fullName: string;
  avatarUrl?: string;
  displayPhone: string;
  fullPhone: string;
  accountType: 'individual' | 'dealer' | 'admin';
  sellerDescription?: string;
  identityDocumentUrl?: string;
  identityVerificationStatus?: 'pending' | 'verified' | 'rejected';
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ??
      'http://localhost:3001';
  }

  async getPublicSellerProfile(
    userId: string,
  ): Promise<PublicSellerProfileDto | null> {
    const base = this.authServiceUrl.replace(/\/$/, '');
    const key = this.configService.get<string>('INTERNAL_API_KEY')?.trim();

    if (!key) {
      this.logger.warn(
        'INTERNAL_API_KEY chưa cấu hình — không gọi được auth-service lấy profile người bán.',
      );
      return null;
    }

    const url = `${base}/api/v1/internal/users/${userId}/public-profile`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ data: PublicSellerProfileDto }>(url, {
          headers: { 'x-internal-api-key': key },
          timeout: 10_000,
        }),
      );
      return data.data ?? null;
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) {
        return null;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Không lấy được public profile seller ${userId}: ${msg}`,
      );
      return null;
    }
  }
}
