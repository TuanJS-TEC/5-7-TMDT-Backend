import { v4 as uuidv4 } from 'uuid';
import { ListingRecord } from './listing-record';
import type { ListingStatus, FuelType, TransmissionType } from '../../domain/entities/listing.entity';
import { ListingPackageType } from '../../domain/entities/listing.entity';

// Giả định có các sellerId từ Auth Service
const MOCK_SELLER_IDS = [
  'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Seller 1
  'b2c3d4e5-f6a7-8901-2345-67890abcdef0', // Seller 2
  'c3d4e5f6-a7b8-9012-3456-7890abcdef01', // Seller 3
];

// Hàm tạo dữ liệu mock
export function createMockListingStore(): Map<string, ListingRecord> {
  const store = new Map<string, ListingRecord>();

  const listings: ListingRecord[] = [
    {
      id: uuidv4(),
      title: 'Xe Toyota Camry 2.5Q 2020 Cực Đẹp',
      description: 'Xe đi giữ gìn, bảo dưỡng định kỳ, nội thất sang trọng.',
      priceVnd: 850000000,
      sellerId: MOCK_SELLER_IDS[0],
      packageType: ListingPackageType.VIP,
      imageUrls: [
        'https://via.placeholder.com/400x300/FF5733/FFFFFF?text=Camry1',
        'https://via.placeholder.com/400x300/C70039/FFFFFF?text=Camry2',
      ],
      carMake: 'Toyota',
      carModel: 'Camry',
      carYear: 2020,
      mileageKm: 45000,
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'approved',
      createdAt: new Date('2024-03-01T10:00:00Z'),
      updatedAt: new Date('2024-03-01T10:00:00Z'),
      approvedAt: new Date('2024-03-02T11:00:00Z'),
      expiresAt: new Date('2024-06-01T10:00:00Z'),
      isDeleted: false,
      viewCount: 120,
      shareCount: 15,
      contactCount: 5,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
    {
      id: uuidv4(),
      title: 'Honda City RS 2023 Mới Lướt 5000km',
      description: 'Phiên bản RS cao cấp, xe gia đình ít sử dụng, còn bảo hành hãng.',
      priceVnd: 580000000,
      sellerId: MOCK_SELLER_IDS[1],
      packageType: ListingPackageType.PREMIUM,
      imageUrls: [
        'https://via.placeholder.com/400x300/33FF57/000000?text=City1',
        'https://via.placeholder.com/400x300/33C700/000000?text=City2',
      ],
      carMake: 'Honda',
      carModel: 'City',
      carYear: 2023,
      mileageKm: 5000,
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'approved',
      createdAt: new Date('2024-03-05T12:30:00Z'),
      updatedAt: new Date('2024-03-05T12:30:00Z'),
      approvedAt: new Date('2024-03-06T13:00:00Z'),
      expiresAt: new Date('2024-07-05T12:30:00Z'),
      isDeleted: false,
      viewCount: 80,
      shareCount: 10,
      contactCount: 3,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
    {
      id: uuidv4(),
      title: 'Mazda 3 Luxury 2021 Đỏ Soul Red',
      description: 'Xe đẹp, không đâm đụng ngập nước, bảo hiểm thân vỏ đầy đủ.',
      priceVnd: 680000000,
      sellerId: MOCK_SELLER_IDS[0],
      packageType: ListingPackageType.BASIC,
      imageUrls: [
        'https://via.placeholder.com/400x300/FF3333/FFFFFF?text=Mazda3_1',
      ],
      carMake: 'Mazda',
      carModel: 'Mazda 3',
      carYear: 2021,
      mileageKm: 30000,
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'sold',
      createdAt: new Date('2024-03-10T09:15:00Z'),
      updatedAt: new Date('2024-03-10T09:15:00Z'),
      approvedAt: new Date('2024-03-11T10:00:00Z'),
      expiresAt: new Date('2024-06-10T09:15:00Z'),
      isDeleted: false,
      viewCount: 150,
      shareCount: 20,
      contactCount: 8,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
    {
      id: uuidv4(),
      title: 'Mercedes C200 2019 Mẫu Mới',
      description: 'Xe nhập khẩu, giữ gìn cẩn thận, chạy êm ái.',
      priceVnd: 1200000000,
      sellerId: MOCK_SELLER_IDS[2],
      packageType: ListingPackageType.VIP,
      imageUrls: [
        'https://via.placeholder.com/400x300/000000/FFFFFF?text=C200_1',
      ],
      carMake: 'Mercedes',
      carModel: 'C200',
      carYear: 2019,
      mileageKm: 60000,
      // fuelType: 'petrol',
      // transmission: 'automatic',
      // status: 'approved',
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'removed',
      createdAt: new Date('2024-03-15T15:45:00Z'),
      updatedAt: new Date('2024-03-15T15:45:00Z'),
      approvedAt: new Date('2024-03-16T16:00:00Z'),
      expiresAt: new Date('2024-06-15T15:45:00Z'),
      isDeleted: true, // Tin đã bị xóa mềm
      removedAt: new Date(),
      removedBy: 'admin-1',
      adminRemovalReason: 'Vi phạm chính sách giá',
      viewCount: 200,
      shareCount: 25,
      contactCount: 10,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
    {
      id: uuidv4(),
      title: 'Hyundai Accent 1.4AT 2022',
      description: 'Xe số tự động, bản đủ, mới 99%.',
      priceVnd: 490000000,
      sellerId: MOCK_SELLER_IDS[1],
      packageType: ListingPackageType.BASIC,
      imageUrls: [
        'https://via.placeholder.com/400x300/007BFF/FFFFFF?text=Accent_1',
      ],
      carMake: 'Hyundai',
      carModel: 'Accent',
      carYear: 2022,
      mileageKm: 15000,
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'pending', // Tin pending
      createdAt: new Date('2024-03-20T11:00:00Z'),
      updatedAt: new Date('2024-03-20T11:00:00Z'),
      expiresAt: new Date('2024-06-20T11:00:00Z'),
      isDeleted: false,
      approvedAt: undefined,
      rejectionReason: undefined,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
     {
      id: uuidv4(),
      title: 'Kia Seltos Premium 2021',
      description: 'Xe SUV gầm cao, tiện nghi đầy đủ, màu trắng.',
      priceVnd: 620000000,
      sellerId: MOCK_SELLER_IDS[0],
      packageType: ListingPackageType.PREMIUM,
      imageUrls: [
        'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Seltos1',
      ],
      carMake: 'Kia',
      carModel: 'Seltos',
      carYear: 2021,
      mileageKm: 28000,
      fuelType: 'petrol',
      transmission: 'automatic',
      status: 'approved',
      createdAt: new Date('2024-03-25T14:00:00Z'),
      updatedAt: new Date('2024-03-25T14:00:00Z'),
      approvedAt: new Date('2024-03-26T14:30:00Z'),
      expiresAt: new Date('2024-06-25T14:00:00Z'),
      isDeleted: false,
      imageAiFailureCount: 0,
      manualImageReviewRequested: false,
      imageModerationState: 'none',
    },
  ];

  listings.forEach((listing) => store.set(listing.id, listing));
  return store;
}

/** In-memory favorite index: userId → set of listingIds. */
export function createMockFavoriteStore(): Map<string, Set<string>> {
  return new Map<string, Set<string>>();
}