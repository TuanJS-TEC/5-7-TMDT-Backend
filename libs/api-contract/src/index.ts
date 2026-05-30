export type UserRole = 'buyer' | 'seller' | 'admin';

export interface SessionUser {
  id: string;
  phone: string;
  role: UserRole;
  fullName: string;
  accountType: string;
  freeListingCredits: number;
}

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: SessionUser;
  redirectPath?: string;
  welcomeMessage?: string;
  refreshToken?: string;
}

export interface ListingDto {
  id: string;
  title: string;
  description: string;
  priceVnd: number;
  sellerId: string;
  packageType: string;
  imageUrls: string[];
  carMake: string;
  carModel: string;
  carYear: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  modificationRequestDetails?: string;
  modificationRequestedBy?: string;
  modificationRequestedAt?: string;
  rejectionReason?: string;
}

export interface ListingListResult {
  items: ListingDto[];
  total: number;
  page: number;
  limit: number;
}

export interface CarMakeOption {
  id: string;
  name: string;
  slug: string;
}

export interface ListingPackage {
  id: string;
  name: string;
  type: string;
  priceVnd: number;
  durationDays: number;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

export interface PaymentOrder {
  id: string;
  status: string;
  amountVnd: number;
  listingId?: string;
  packageType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VietQrResponse {
  qrImageUrl?: string;
  qrContent?: string;
  amountVnd?: number;
  orderId?: string;
}

export interface SellerProfile {
  fullName: string;
  phone: string;
  accountType: string;
  avatarUrl?: string;
  showroomName?: string;
  showroomAddress?: string;
}

export interface RevenueDashboardDto {
  totalRevenueVnd: number;
  totalOrders: number;
  recentTransactions: Array<{
    id: string;
    amountVnd: number;
    status: string;
    createdAt: string;
  }>;
}
