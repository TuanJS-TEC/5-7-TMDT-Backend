import type { ListingPackageType } from '../entities/listing.entity';

/** Thông tin chi tiết của một gói đăng tin */
export interface ListingPackageInfo {
  type: ListingPackageType;
  name: string;
  /** Giá gói (VND) */
  priceVnd: number;
  /** Thời hạn hiển thị (ngày) */
  durationDays: number;
  /** Số ảnh tối đa được phép đăng */
  maxImages: number;
  /** Có được đẩy tin lên đầu không */
  featured: boolean;
  /** Có hỗ trợ badge nổi bật không */
  badge: string | null;
  /** Danh sách tính năng kèm theo */
  features: string[];
  /** Mô tả ngắn */
  description: string;
}

/** Danh sách tất cả các gói đăng tin trong hệ thống (UC18) */
export const LISTING_PACKAGES: ListingPackageInfo[] = [
  {
    type: 'basic',
    name: 'Gói Cơ Bản',
    priceVnd: 0,
    durationDays: 7,
    maxImages: 3,
    featured: false,
    badge: null,
    description: 'Đăng tin miễn phí, phù hợp cho người bán lần đầu.',
    features: [
      'Hiển thị tối đa 7 ngày',
      'Tối đa 3 ảnh',
      'Xuất hiện trong kết quả tìm kiếm thông thường',
    ],
  },
  {
    type: 'premium',
    name: 'Gói Nổi Bật',
    priceVnd: 99_000,
    durationDays: 30,
    maxImages: 10,
    featured: true,
    badge: 'NỔI BẬT',
    description: 'Tăng khả năng hiển thị, tiếp cận nhiều người mua hơn.',
    features: [
      'Hiển thị tối đa 30 ngày',
      'Tối đa 10 ảnh',
      'Badge "Nổi Bật" trên tin đăng',
      'Ưu tiên xuất hiện trong kết quả tìm kiếm',
      'Thống kê lượt xem',
    ],
  },
  {
    type: 'vip',
    name: 'Gói VIP',
    priceVnd: 299_000,
    durationDays: 60,
    maxImages: 20,
    featured: true,
    badge: 'VIP',
    description: 'Gói cao cấp nhất, tối đa hóa khả năng tiếp cận người mua.',
    features: [
      'Hiển thị tối đa 60 ngày',
      'Tối đa 20 ảnh',
      'Badge "VIP" nổi bật',
      'Hiển thị ưu tiên cao nhất trên trang chủ và tìm kiếm',
      'Thống kê lượt xem & tỷ lệ chuyển đổi',
      'Hỗ trợ khách hàng ưu tiên 24/7',
    ],
  },
];
