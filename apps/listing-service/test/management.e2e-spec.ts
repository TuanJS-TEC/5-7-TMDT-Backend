import { v4 as uuidv4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createMockListingStore } from '../src/infrastructure/persistence/mock-listing.store';
import { LISTING_STORE } from '../src/infrastructure/persistence/listing.store.token';
import { ListingRecord } from '../src/infrastructure/persistence/listing-record';
import { ProfileService } from '../src/infrastructure/auth/profile.service';
import { ListingStatus, ListingPackageType } from '../src/domain/entities/listing.entity';
import { PaymentServiceHttpClient } from '../src/infrastructure/payment/payment-service-http.client';
import { JwtRequestUser, JwtAuthGuard, SellerGuard } from '@car-marketplace/common';
import { VersioningType } from '@nestjs/common';

// Giả lập một seller ID có quyền hợp lệ
const MOCK_SELLER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Phải khớp với sellerId trong mock-listing.store
const MOCK_ADMIN_ID = 'admin-user-123-xyz';
const MOCK_BUYER_ID = 'buyer-user-456-abc';

// Giả lập JWT payload cho seller và admin
const mockSellerJwtUser: JwtRequestUser = {
  userId: MOCK_SELLER_ID,
  phone: '0987654321',
  role: 'seller',
};

const mockAdminJwtUser: JwtRequestUser = {
  userId: MOCK_ADMIN_ID,
  phone: '0900000000',
  role: 'admin',
};

// Mock ProfileService để tránh lỗi khi ListingController gọi nó
const mockProfileService = {
  getPublicSellerProfile: jest.fn((userId: string) => {
    // Trả về mock data dựa trên userId
    if (userId === MOCK_SELLER_ID) {
      return Promise.resolve({
        id: MOCK_SELLER_ID,
        fullName: 'Nguyễn Văn A',
        avatarUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=A',
        displayPhone: '098-xxx-789',
        accountType: 'dealer',
        sellerDescription: 'Chuyên mua bán xe cũ chất lượng.',
        fullPhone: '0987654321',
      });
    }
    return Promise.resolve(null);
  }),
};

// Mock PaymentServiceHttpClient
const mockPaymentServiceHttpClient = {
  getPaymentOrderStatus: jest.fn((orderId: string, userId: string) => {
    if (orderId.includes('success')) {
      return Promise.resolve({ orderId, status: 'success' });
    }
    if (orderId.includes('failed')) {
      return Promise.resolve({ orderId, status: 'failed' });
    }
    return Promise.resolve({ orderId, status: 'pending' });
  }),
};

describe('Listings Management Module (E2E) - UC24, UC25, UC26 Mock Tests', () => {
  let app: INestApplication;
  let listingStore: Map<string, ListingRecord>;
  let initialListings: ListingRecord[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LISTING_STORE)
      .useValue(createMockListingStore())
      .overrideProvider(ProfileService)
      .useValue(mockProfileService)
      .overrideProvider(PaymentServiceHttpClient)
      .useValue(mockPaymentServiceHttpClient)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req['user'] = mockSellerJwtUser; // Gắn mock user vào request
          return true; // Luôn cho phép truy cập (test mock)
      }})
      .overrideGuard(SellerGuard)
      .useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          // Kiểm tra xem req.user có phải là seller không
          return req.user && req.user.role === 'seller';
      }})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();

    listingStore = moduleFixture.get<Map<string, ListingRecord>>(LISTING_STORE);
    initialListings = [...listingStore.values()];
  });

  afterAll(async () => {
    await app.close();
  });

  // --- UC25: Đánh dấu đã bán ---
  describe('PATCH /v1/listings/:id/mark-sold (UC25: Mark listing as sold)', () => {
    it('should mark an approved listing as sold for the owner', async () => {
      const listingToMarkSold = initialListings.find(
        (l) => l.sellerId === MOCK_SELLER_ID && l.status === 'approved'
      );
      if (!listingToMarkSold) throw new Error('No approved listing found for UC25 test');

      await request(app.getHttpServer())
        .patch(`/api/v1/listings/${listingToMarkSold.id}/mark-sold`)
        .send({})
        .expect(200);

      const updatedListing = listingStore.get(listingToMarkSold.id);
      expect(updatedListing?.status).toBe('sold');
    });

    it('should return 404 if listing not found', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/listings/${uuidv4()}/mark-sold`)
        .send({})
        .expect(404);
    });

    it('should return 401 if not the owner', async () => {
      // Giả lập user khác sở hữu tin
      const otherSellerListing = initialListings.find(
        (l) => l.sellerId !== MOCK_SELLER_ID && l.status === 'approved'
      );
      if (!otherSellerListing) throw new Error('No listing from other seller found');

      // Override guard để mock user khác
      const moduleFixtureOtherUser: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(LISTING_STORE).useValue(listingStore)
      .overrideProvider(ProfileService).useValue(mockProfileService)
      .overrideProvider(PaymentServiceHttpClient).useValue(mockPaymentServiceHttpClient)
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req['user'] = { ...mockSellerJwtUser, userId: uuidv4() }; // Mock user ID khác
          return true;
      }})
      .overrideGuard(SellerGuard).useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.user && req.user.role === 'seller';
      }})
      .compile();

      const appOtherUser = moduleFixtureOtherUser.createNestApplication();
      appOtherUser.setGlobalPrefix('api');
      appOtherUser.enableVersioning({ type: VersioningType.URI });
      await appOtherUser.init();

      await request(appOtherUser.getHttpServer())
        .patch(`/api/v1/listings/${otherSellerListing.id}/mark-sold`)
        .send({})
        .expect(403);

      await appOtherUser.close();
    });
  });

  // --- UC26: Xóa tin đăng (Soft Delete) ---
  describe('DELETE /v1/listings/:id (UC26: Delete listing)', () => {
    it('should soft delete an approved listing for the owner', async () => {
      const listingToDelete = initialListings.find(
        (l) => l.sellerId === MOCK_SELLER_ID && l.status === 'approved' && !l.isDeleted
      );
      if (!listingToDelete) throw new Error('No active listing found for UC26 test');

      await request(app.getHttpServer())
        .delete(`/api/v1/listings/${listingToDelete.id}`)
        .send({})
        .expect(204);

      const deletedListing = listingStore.get(listingToDelete.id);
      expect(deletedListing?.isDeleted).toBe(true);
      expect(deletedListing?.status).toBe('removed');
    });

    it('should return 404 if listing not found', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/listings/${uuidv4()}`)
        .send({})
        .expect(404);
    });

    it('should return 403 if not the owner', async () => {
      const otherSellerListing = initialListings.find(
        (l) => l.sellerId !== MOCK_SELLER_ID && l.status === 'approved' && !l.isDeleted
      );
      if (!otherSellerListing) throw new Error('No listing from other seller found for UC26 Unauthorized test');

      const moduleFixtureOtherUser: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(LISTING_STORE).useValue(listingStore)
      .overrideProvider(ProfileService).useValue(mockProfileService)
      .overrideProvider(PaymentServiceHttpClient).useValue(mockPaymentServiceHttpClient)
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req['user'] = { ...mockSellerJwtUser, userId: uuidv4() };
          return true;
      }})
      .overrideGuard(SellerGuard).useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.user && req.user.role === 'seller';
      }})
      .compile();

      const appOtherUser = moduleFixtureOtherUser.createNestApplication();
      appOtherUser.setGlobalPrefix('api');
      appOtherUser.enableVersioning({ type: VersioningType.URI });
      await appOtherUser.init();

      await request(appOtherUser.getHttpServer())
        .delete(`/api/v1/listings/${otherSellerListing.id}`)
        .send({})
        .expect(403);

      await appOtherUser.close();
    });
  });

  // --- UC24: Gia hạn tin đăng ---
  describe('POST /v1/listings/:id/renew (UC24: Renew listing)', () => {
    it('should renew an existing listing if payment is successful and user is owner', async () => {
      const listingToRenew = initialListings.find(
        (l) => l.sellerId === MOCK_SELLER_ID && l.status === 'approved' && !l.isDeleted
      );
      if (!listingToRenew) throw new Error('No approved listing found for UC24 test');

      const oldExpiresAt = listingToRenew.expiresAt;
      const newPackage = ListingPackageType.PREMIUM;
      const paymentOrderId = 'mock-success-payment-order-123';

      await request(app.getHttpServer())
        .post(`/api/v1/listings/${listingToRenew.id}/renew`)
        .send({
          listingId: listingToRenew.id,
          newPackageType: newPackage,
          paymentOrderId: paymentOrderId,
        })
        .expect(200);

      const renewedListing = listingStore.get(listingToRenew.id);
      expect(renewedListing?.status).toBe('approved');
      expect(renewedListing?.packageType).toBe(newPackage);
      expect(renewedListing?.expiresAt.getTime()).toBeGreaterThan(oldExpiresAt.getTime());
    });

    it('should return 400 if payment is not successful', async () => {
      const listingToRenew = initialListings.find(
        (l) => l.sellerId === MOCK_SELLER_ID && l.status === 'approved' && !l.isDeleted
      );
      if (!listingToRenew) throw new Error('No approved listing found for UC24 test');

      const paymentOrderId = 'mock-failed-payment-order-456'; // Giả lập failed payment

      await request(app.getHttpServer())
        .post(`/api/v1/listings/${listingToRenew.id}/renew`)
        .send({
          listingId: listingToRenew.id,
          newPackageType: ListingPackageType.BASIC,
          paymentOrderId: paymentOrderId,
        })
        .expect(400); // BadRequestException
    });

    it('should return 403 if not the owner', async () => {
        const otherSellerListing = initialListings.find(
            (l) => l.sellerId !== MOCK_SELLER_ID && l.status === 'approved' && !l.isDeleted
        );
        if (!otherSellerListing) throw new Error('No listing from other seller found for UC24 Unauthorized test');

        const moduleFixtureOtherUser: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider(LISTING_STORE).useValue(listingStore)
        .overrideProvider(ProfileService).useValue(mockProfileService)
        .overrideProvider(PaymentServiceHttpClient).useValue(mockPaymentServiceHttpClient)
        .overrideGuard(JwtAuthGuard).useValue({ canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            req['user'] = { ...mockSellerJwtUser, userId: uuidv4() };
            return true;
        }})
        .overrideGuard(SellerGuard).useValue({ canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            return req.user && req.user.role === 'seller';
        }})
        .compile();

        const appOtherUser = moduleFixtureOtherUser.createNestApplication();
        appOtherUser.setGlobalPrefix('api');
        appOtherUser.enableVersioning({ type: VersioningType.URI });
        await appOtherUser.init();

        await request(appOtherUser.getHttpServer())
            .post(`/api/v1/listings/${otherSellerListing.id}/renew`)
            .send({
                listingId: otherSellerListing.id,
                newPackageType: ListingPackageType.BASIC,
                paymentOrderId: 'mock-success-payment-order-789',
            })
            .expect(403);

        await appOtherUser.close();
    });
  });
});