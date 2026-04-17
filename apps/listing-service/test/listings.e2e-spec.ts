import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../src/app.module';
import { createMockListingStore } from '../src/infrastructure/persistence/mock-listing.store';
import { LISTING_STORE, FAVORITE_STORE } from '../src/infrastructure/persistence/listing.store.token';
import { ListingRecord } from '../src/infrastructure/persistence/listing-record';
import { ProfileService } from '../src/infrastructure/auth/profile.service';
import { ListingResponseDto } from '../src/presentation/dto/listing.response.dto';
import { createMockFavoriteStore } from '../src/infrastructure/persistence/mock-listing.store';

// Dữ liệu mock từ mock-listing.store
const mockListingsData = createMockListingStore();
const mockFavoriteData = createMockFavoriteStore();
const sellerIdForUC4 = 'a1b2c3d4-e5f6-4a90-9234-567890abcdef'; // ID của Seller 1 từ mock-listing.store
const listingIdForUC4 = [...mockListingsData.values()].find(
  (l) => l.sellerId === sellerIdForUC4 && l.status === 'approved'
)?.id; // Một ID tin đăng approved

// Mock ProfileService để tránh lỗi khi ListingController gọi nó
const mockProfileService = {
  getPublicSellerProfile: jest.fn((userId: string) => {
    // Trả về mock data dựa trên userId
    if (userId === sellerIdForUC4) {
      return Promise.resolve({
        id: sellerIdForUC4,
        fullName: 'Nguyễn Văn A',
        avatarUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=A',
        displayPhone: '098-xxx-789',
        fullPhone: '0981234789',
        accountType: 'dealer',
        sellerDescription: 'Chuyên mua bán xe cũ chất lượng.',
      });
    }
    return Promise.resolve(null);
  }),
};


describe('Listings Module (E2E) - UC1 to UC4 Mock Tests', () => {
  let app: INestApplication;
  let listingStore: Map<string, ListingRecord>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LISTING_STORE) // Override LISTING_STORE để đảm bảo là một instance mới cho mỗi test
      .useValue(mockListingsData)
      .overrideProvider(FAVORITE_STORE) // Override FAVORITE_STORE để test qua nhiều file
      .useValue(mockFavoriteData)
      .overrideProvider(ProfileService) // Override ProfileService
      .useValue(mockProfileService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Lấy instance của mock store đã override
    listingStore = moduleFixture.get<Map<string, ListingRecord>>(LISTING_STORE);
  });

  afterAll(async () => {
    await app.close();
  });

  // --- UC1: Duyệt danh sách xe ---
  describe('GET /v1/listings (UC1: Browse listings)', () => {
    it('should return a paginated list of approved listings by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].status).toBe('approved');
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10); // Default limit from controller
    });

    it('should return a paginated list for a specific page and limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings?page=2&limit=1')
        .expect(200);

      expect(response.body.items.length).toBe(1);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(1);
    });

    it('should sort listings by createdAt in descending order by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings?limit=10')
        .expect(200);

      const items = response.body.items as ListingResponseDto[];
      expect(items.length).toBeGreaterThan(1);
      // Kiểm tra xem tin mới hơn có xuất hiện trước không
      expect(new Date(items[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(items[1].createdAt).getTime());
    });

    it('should return an empty list if no listings are found for the status (A1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings?status=non_existent_status')
        .expect(200); // Vẫn là 200 OK nếu không tìm thấy, theo UC A1

      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  // --- UC2: Tìm kiếm xe ---
  describe('GET /v1/listings/search (UC2: Search listings)', () => {
    it('should return listings matching a keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/search?keyword=toyota')
        .expect(200);

      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].carMake).toBe('Toyota');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should return an empty list if no keyword matches (A1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/search?keyword=nonexistentcar')
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should require a keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/search')
        .expect(400); // 400 Bad Request nếu thiếu keyword
      expect(response.body.message).toBe('Keyword is required for search');
    });
  });

  // --- UC3: Lọc xe nâng cao ---
  describe('GET /v1/listings/filter (UC3: Advanced filter)', () => {
    it('should return listings matching price range and car make', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/filter?minPrice=500000000&maxPrice=700000000&carMake=Honda')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].carMake).toBe('Honda');
      expect(response.body.items[0].priceVnd).toBeGreaterThanOrEqual(500000000);
      expect(response.body.items[0].priceVnd).toBeLessThanOrEqual(700000000);
    });

    it('should return listings matching year range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/filter?minYear=2021&maxYear=2022')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].carYear).toBeGreaterThanOrEqual(2021);
      expect(response.body.items[0].carYear).toBeLessThanOrEqual(2022);
    });

    it('should return an empty list if no filters match (A1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/filter?minPrice=5000000000&maxPrice=6000000000') // Giá quá cao
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  // --- UC4: Xem chi tiết xe ---
  describe('GET /v1/listings/:id (UC4: View listing details)', () => {
    it('should return details for an approved listing and include seller info', async () => {
      if (!listingIdForUC4) {
        throw new Error('No approved listing found for testing UC4');
      }
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${listingIdForUC4}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(listingIdForUC4);
      expect(response.body.status).toBe('approved');
      expect(response.body.seller).toBeDefined();
      expect(response.body.seller.fullName).toBe('Nguyễn Văn A');
    });

    it('should return 404 if listing is not found or not approved (A1)', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .get(`/api/v1/listings/${nonExistentId}`)
        .expect(404); // UC4 A1

      const pendingListing = [...listingStore.values()].find(l => l.status === 'pending');
      if (pendingListing) {
        await request(app.getHttpServer())
          .get(`/api/v1/listings/${pendingListing.id}`)
          .expect(404); // UC4 A1: tin pending cũng không hiển thị chi tiết công khai
      }
    });
  });

  // --- UC5: Xem số điện thoại người bán ---
  describe('GET /v1/listings/:id/phone (UC5: View seller phone)', () => {
    it('should return the full phone number for an approved listing', async () => {
      if (!listingIdForUC4) {
        throw new Error('No approved listing found for testing UC5');
      }
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${listingIdForUC4}/phone`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.phone).toBe('0981234789');
    });

    it('should return 404 if listing is not found or not approved', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .get(`/api/v1/listings/${nonExistentId}/phone`)
        .expect(404);
    });
  });

  // --- UC6: Chat Zalo với người bán ---
  describe('GET /v1/listings/:id/zalo (UC6: Get Zalo chat link)', () => {
    it('should return the Zalo link for an approved listing', async () => {
      if (!listingIdForUC4) {
        throw new Error('No approved listing found for testing UC6');
      }
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${listingIdForUC4}/zalo`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.zaloUrl).toBe('https://zalo.me/0981234789');
    });

    it('should return 404 if listing is not found or not approved', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .get(`/api/v1/listings/${nonExistentId}/zalo`)
        .expect(404);
    });
  });

  // --- UC7: So sánh xe (tối đa 3 xe) ---
  describe('GET /v1/listings/compare (UC7: Compare up to 3 listings)', () => {
    it('should return multiple listings when valid IDs are provided', async () => {
      const allApproved = [...listingStore.values()].filter(l => l.status === 'approved');
      if (allApproved.length >= 2) {
        const ids = [allApproved[0].id, allApproved[1].id].join(',');
        const response = await request(app.getHttpServer())
          .get(`/api/v1/listings/compare?ids=${ids}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body.length).toBe(2);
      }
    });

    it('should return 400 if more than 3 IDs are provided', async () => {
      const ids = [uuidv4(), uuidv4(), uuidv4(), uuidv4()].join(',');
      await request(app.getHttpServer())
        .get(`/api/v1/listings/compare?ids=${ids}`)
        .expect(400);
    });

    it('should return 400 if no IDs are provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/listings/compare`)
        .expect(400);
    });
  });

  // --- UC8: Lưu xe yêu thích ---
  describe('Favorites (UC8: Favorite Listings)', () => {
    const testUserId = uuidv4();

    it('should add a listing to favorites', async () => {
      if (!listingIdForUC4) {
        throw new Error('No approved listing found for testing UC8');
      }
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${listingIdForUC4}/favorite`)
        .send({ userId: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get the list of favorite listings for a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/favorites?userId=${testUserId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe(listingIdForUC4);
    });

    it('should remove a listing from favorites', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/listings/${listingIdForUC4}/favorite`)
        .send({ userId: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify removal
      const verifyResp = await request(app.getHttpServer())
        .get(`/api/v1/listings/favorites?userId=${testUserId}`)
        .expect(200);

      expect(verifyResp.body.length).toBe(0);
    });
  });
});