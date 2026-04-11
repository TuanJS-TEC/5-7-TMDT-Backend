import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs'; // Thêm import này

// Định nghĩa DTO cho response từ Auth Service (mock)
export interface PublicSellerProfileDto {
  id: string; // userId
  fullName: string;
  avatarUrl?: string;
  displayPhone: string; // SĐT hiển thị công khai (có thể bị che)
  fullPhone: string; // UC5, UC6: SĐT đầy đủ (không che)
  accountType: 'individual' | 'dealer' | 'admin';
  sellerDescription?: string;
}

@Injectable()
export class ProfileService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Inject HttpService
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ??
      'http://localhost:3002'; // Lấy URL Auth Service từ config
  }

  async getPublicSellerProfile(userId: string): Promise<PublicSellerProfileDto | null> {
    try {
      // Mock data người bán
      const mockSellerProfiles: Record<string, PublicSellerProfileDto> = {
        'a1b2c3d4-e5f6-7890-1234-567890abcdef': {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          fullName: 'Nguyễn Văn A',
          avatarUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=A',
          displayPhone: '098-xxx-789',
          fullPhone: '0981234789',
          accountType: 'dealer',
          sellerDescription: 'Chuyên mua bán xe cũ chất lượng.',
        },
        'b2c3d4e5-f6a7-8901-2345-67890abcdef0': {
          id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
          fullName: 'Trần Thị B',
          avatarUrl: 'https://via.placeholder.com/150/C70039/FFFFFF?text=B',
          displayPhone: '091-xxx-123',
          fullPhone: '0912345123',
          accountType: 'individual',
          sellerDescription: 'Bán xe gia đình, giữ gìn cẩn thận.',
        },
        'c3d4e5f6-a7b8-9012-3456-7890abcdef01': {
          id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01',
          fullName: 'Lê Văn C Showroom',
          avatarUrl: 'https://via.placeholder.com/150/900C3F/FFFFFF?text=C',
          displayPhone: '088-xxx-456',
          fullPhone: '0884567456',
          accountType: 'dealer',
          sellerDescription: 'Showroom xe uy tín, cam kết không lỗi.',
        },
      };

      const profile = mockSellerProfiles[userId];
      if (profile) {
          console.log(`Mock: Lấy public profile của seller ${userId}`);
          return profile;
      }

      // Nếu muốn thực sự gọi Auth Service (sau này khi có public endpoint)
      // const response = await firstValueFrom(
      //   this.httpService.get<PublicSellerProfileDto>(`${this.authServiceUrl}/v1/users/${userId}/public-profile`),
      // );
      // return response.data;

      return null;
    } catch (error: any) {
      console.error(`Error fetching seller public profile for user ${userId}:`, error.message);
      return null;
    }
  }
}