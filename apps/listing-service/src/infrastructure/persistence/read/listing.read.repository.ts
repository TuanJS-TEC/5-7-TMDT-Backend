import { Inject, Injectable } from '@nestjs/common';
import { LISTING_STORE } from '../listing.store.token';
import type { ListingRecord } from '../listing-record';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';
import type { ListingStatus, FuelType, TransmissionType } from '../../../domain/entities/listing.entity';

@Injectable()
export class ListingReadRepository {
  constructor(
    @Inject(LISTING_STORE)
    private readonly store: Map<string, ListingRecord>,
  ) {}

  private toDto(r: ListingRecord): ListingResponseDto {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      priceVnd: r.priceVnd,
      sellerId: r.sellerId,
      packageType: r.packageType,
      imageUrls: r.imageUrls ?? [],
      carMake: r.carMake,
      carModel: r.carModel,
      carYear: r.carYear,
      mileageKm: r.mileageKm,
      fuelType: r.fuelType,
      transmission: r.transmission,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectionReason: r.rejectionReason,
      modificationRequestDetails: r.modificationRequestDetails,
      modificationRequestedBy: r.modificationRequestedBy,
      modificationRequestedAt: r.modificationRequestedAt?.toISOString(),
    };
  }

  async findById(id: string): Promise<ListingResponseDto | null> {
    const r = this.store.get(id);
    return r ? this.toDto(r) : null;
  }

  // UC7 — Lấy nhiều xe theo mảng ID
  async findByIds(ids: string[]): Promise<ListingResponseDto[]> {
    return ids
      .map((id) => this.store.get(id))
      .filter((r): r is ListingRecord => r !== undefined && r.status === 'approved')
      .map((r) => this.toDto(r));
  }

  /** UC17 — trả về raw records để listing-image.service lọc manual review */
  async findAllRecords(): Promise<ListingRecord[]> {
    return [...this.store.values()];
  }

  async findMany(
    page: number,
    limit: number,
    // status?: string,
    status: ListingStatus | string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    let rows = [...this.store.values()];
    // if (status) {
    //   rows = rows.filter((x) => x.status === status);
    // }
    // Lọc theo status (chỉ lấy tin chưa bị xóa nếu có trường isDeleted)
    rows = rows.filter((x) => x.status === status);
    // Nếu có trường isDeleted trong ListingRecord, thêm: .filter(x => !x.isDeleted)

    // Sắp xếp
    rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Type guards hoặc kiểm tra sự tồn tại của thuộc tính
      if (sortBy === 'priceVnd') {
        aValue = a.priceVnd;
        bValue = b.priceVnd;
      } else if (sortBy === 'carYear') {
        aValue = a.carYear;
        bValue = b.carYear;
      } else { // Mặc định hoặc cho createdAt/updatedAt
        aValue = (a as any)[sortBy]?.getTime ? (a as any)[sortBy].getTime() : (a as any)[sortBy];
        bValue = (b as any)[sortBy]?.getTime ? (b as any)[sortBy].getTime() : (b as any)[sortBy];
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      //.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + limit)
      .map((r) => this.toDto(r));
    return { items, total, page, limit };
  }

  async findBySeller(
    sellerId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const rows = [...this.store.values()].filter(
      (x) => x.sellerId === sellerId && x.status === 'approved',
    );
    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + limit)
      .map((r) => this.toDto(r));
    return { items, total, page, limit };
  }

  // Phương thức search mới cho UC2
  async search(
    keyword: string,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const lowerCaseKeyword = keyword.toLowerCase();
    let rows = [...this.store.values()];

    // Lọc theo keyword trong title, carMake, carModel (mock logic)
    rows = rows.filter(
      (x) =>
        x.status === 'approved' && // Chỉ tìm kiếm trong các tin đã duyệt
        (x.title.toLowerCase().includes(lowerCaseKeyword) ||
          x.carMake.toLowerCase().includes(lowerCaseKeyword) ||
          x.carModel.toLowerCase().includes(lowerCaseKeyword)),
    );

    // Sắp xếp (sử dụng lại logic sorting từ findMany)
    rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'priceVnd') {
        aValue = a.priceVnd;
        bValue = b.priceVnd;
      } else if (sortBy === 'carYear') {
        aValue = a.carYear;
        bValue = b.carYear;
      } else {
        aValue = (a as any)[sortBy]?.getTime ? (a as any)[sortBy].getTime() : (a as any)[sortBy];
        bValue = (b as any)[sortBy]?.getTime ? (b as any)[sortBy].getTime() : (b as any)[sortBy];
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      .slice(start, start + limit)
      .map((r) => this.toDto(r));
    return { items, total, page, limit };
  }

  // Phương thức filter mới cho UC3
  async filter(
    minPrice: number,
    maxPrice: number,
    carMake: string | undefined,
    carModel: string | undefined,
    minYear: number,
    maxYear: number,
    fuelType: FuelType | string | undefined,
    transmission: TransmissionType | string | undefined,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    let rows = [...this.store.values()];

    // Lọc theo tất cả các tiêu chí (mock logic)
    rows = rows.filter(
      (x) =>
        x.status === 'approved' && // Chỉ lọc trong các tin đã duyệt
        x.priceVnd >= minPrice &&
        x.priceVnd <= maxPrice &&
        x.carYear >= minYear &&
        x.carYear <= maxYear &&
        (!carMake || x.carMake.toLowerCase().includes(carMake.toLowerCase())) &&
        (!carModel || x.carModel.toLowerCase().includes(carModel.toLowerCase())) &&
        (!fuelType || x.fuelType === fuelType) &&
        (!transmission || x.transmission === transmission),
    );

    // Sắp xếp (sử dụng lại logic sorting)
    rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'priceVnd') {
        aValue = a.priceVnd;
        bValue = b.priceVnd;
      } else if (sortBy === 'carYear') {
        aValue = a.carYear;
        bValue = b.carYear;
      } else {
        aValue = (a as any)[sortBy]?.getTime ? (a as any)[sortBy].getTime() : (a as any)[sortBy];
        bValue = (b as any)[sortBy]?.getTime ? (b as any)[sortBy].getTime() : (b as any)[sortBy];
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      .slice(start, start + limit)
      .map((r) => this.toDto(r));
    return { items, total, page, limit };
  }
}
