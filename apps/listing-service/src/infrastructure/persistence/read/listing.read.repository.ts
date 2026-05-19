import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ListingRecord } from '../listing-record';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';
import type { ListingStatus, FuelType, TransmissionType } from '../../../domain/entities/listing.entity';
import { ListingPackageType } from '../../../domain/entities/listing.entity';
import { ListingOrmEntity } from '../typeorm/listing.orm.entity';

@Injectable()
export class ListingReadRepository {
  constructor(
    @InjectRepository(ListingOrmEntity)
    private readonly repo: Repository<ListingOrmEntity>,
  ) {}

  private toDto(r: ListingOrmEntity): ListingResponseDto {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      priceVnd: Number(r.priceVnd),
      sellerId: r.sellerId,
      packageType: r.packageType as ListingPackageType,
      imageUrls: r.imageUrls ?? [],
      carMake: r.carMake,
      carModel: r.carModel,
      carYear: r.carYear,
      mileageKm: r.mileageKm,
      fuelType: r.fuelType as FuelType,
      transmission: r.transmission as TransmissionType,
      status: r.status as ListingStatus,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectionReason: r.rejectionReason ?? undefined,
      shareCount: r.shareCount ?? 0,
      viewCount: r.viewCount ?? 0,
      favoriteCount: r.favoriteCount ?? 0,
      contactCount: r.contactCount ?? 0,
      pushedAt: r.pushedAt?.toISOString(),
      isFeatured: r.isFeatured ?? false,
      featuredUntil: r.featuredUntil?.toISOString(),
      modificationRequestDetails: r.modificationRequestDetails ?? undefined,
      modificationRequestedBy: r.modificationRequestedBy ?? undefined,
      modificationRequestedAt: r.modificationRequestedAt?.toISOString(),
      removedAt: r.removedAt?.toISOString(),
      removedBy: r.removedBy ?? undefined,
      adminRemovalReason: r.adminRemovalReason ?? undefined,
      expiresAt: r.expiresAt?.toISOString() ?? new Date().toISOString(),
      isDeleted: r.isDeleted ?? false,
    };
  }

  async findById(id: string): Promise<ListingResponseDto | null> {
    const r = await this.repo.findOneBy({ id } as any);
    return r ? this.toDto(r) : null;
  }

  /** UC56 — tìm tin đang active (approved) nhưng đã quá hạn hiển thị */
  async findApprovedExpired(before: Date): Promise<ListingRecord[]> {
    const rows = await this.repo
      .createQueryBuilder('l')
      .where('l.isDeleted = false')
      .andWhere('l.status = :status', { status: 'approved' })
      .andWhere('l.expiresAt < :before', { before })
      .getMany();
    return rows as unknown as ListingRecord[];
  }

  // UC7 — Lấy nhiều xe theo mảng ID
  async findByIds(ids: string[]): Promise<ListingResponseDto[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('l')
      .where('l.id IN (:...ids)', { ids })
      .andWhere('l.status = :status', { status: 'approved' })
      .getMany();
    return rows.map((r) => this.toDto(r));
  }

  // UC20 — Thống kê tổng hợp tin đăng
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPackage: Record<string, number>;
    byMake: Record<string, number>;
  }> {
    const all = await this.repo.find();
    const total = all.length;

    const byStatus: Record<string, number> = {};
    const byPackage: Record<string, number> = {};
    const byMake: Record<string, number> = {};

    for (const r of all) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byPackage[r.packageType] = (byPackage[r.packageType] ?? 0) + 1;
      byMake[r.carMake] = (byMake[r.carMake] ?? 0) + 1;
    }

    return { total, byStatus, byPackage, byMake };
  }

  /** UC17 — trả về raw records để listing-image.service lọc manual review */
  async findAllRecords(): Promise<ListingRecord[]> {
    const rows = await this.repo.find();
    return rows as unknown as ListingRecord[];
  }

  async findMany(
    page: number,
    limit: number,
    status: ListingStatus | string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    search?: string,
    make?: string,
    fuelType?: string,
    transmission?: string,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    let rows = await this.repo.find({
      where: { status: status as string },
    });
    
    // Lọc theo search (keyword)
    if (search) {
      const lowerKeyword = search.toLowerCase();
      rows = rows.filter((x) =>
        x.title.toLowerCase().includes(lowerKeyword) ||
        x.carMake.toLowerCase().includes(lowerKeyword) ||
        x.carModel.toLowerCase().includes(lowerKeyword)
      );
    }
    
    // Lọc theo make
    if (make) {
      const lowerMake = make.toLowerCase();
      rows = rows.filter((x) => x.carMake?.toLowerCase() === lowerMake);
    }
    
    // Lọc theo fuelType
    if (fuelType) {
      rows = rows.filter((x) => x.fuelType === fuelType);
    }
    
    // Lọc theo transmission
    if (transmission) {
      rows = rows.filter((x) => x.transmission === transmission);
    }
    
    // Lọc theo minPrice
    if (minPrice !== undefined && !isNaN(minPrice)) {
      rows = rows.filter((x) => Number(x.priceVnd) >= minPrice);
    }
    
    // Lọc theo maxPrice
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      rows = rows.filter((x) => Number(x.priceVnd) <= maxPrice);
    }

    // Sắp xếp
    rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Type guards hoặc kiểm tra sự tồn tại của thuộc tính
      if (sortBy === 'priceVnd') {
        aValue = Number(a.priceVnd);
        bValue = Number(b.priceVnd);
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
    const items = rows.slice(start, start + limit).map((r) => this.toDto(r));
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
    const rows = await this.repo.find({
      where: { sellerId, status: 'approved' },
    });
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
    let rows = await this.repo.find();

    // Lọc theo keyword trong title, carMake, carModel (mock logic)
    rows = rows.filter(
      (x) =>
        x.status === 'approved' &&
        (x.title.toLowerCase().includes(lowerCaseKeyword) ||
          x.carMake.toLowerCase().includes(lowerCaseKeyword) ||
          x.carModel.toLowerCase().includes(lowerCaseKeyword)),
    );

    // Sắp xếp (sử dụng lại logic sorting từ findMany)
    rows.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'priceVnd') {
        aValue = Number(a.priceVnd);
        bValue = Number(b.priceVnd);
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
    let rows = await this.repo.find();

    // Lọc theo tất cả các tiêu chí (mock logic)
    rows = rows.filter(
      (x) =>
        x.status === 'approved' &&
        Number(x.priceVnd) >= minPrice &&
        Number(x.priceVnd) <= maxPrice &&
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
