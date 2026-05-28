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
  /** UC33 — chi tiết admin yêu cầu seller chỉnh sửa */
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
