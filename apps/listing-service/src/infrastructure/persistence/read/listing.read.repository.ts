import { Inject, Injectable } from '@nestjs/common';
import { LISTING_STORE } from '../listing.store.token';
import type { ListingRecord } from '../listing-record';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

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
    };
  }

  async findById(id: string): Promise<ListingResponseDto | null> {
    const r = this.store.get(id);
    return r ? this.toDto(r) : null;
  }

  /** UC17 — trả về raw records để listing-image.service lọc manual review */
  async findAllRecords(): Promise<ListingRecord[]> {
    return [...this.store.values()];
  }

  async findMany(
    page: number,
    limit: number,
    status?: string,
  ): Promise<{
    items: ListingResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    let rows = [...this.store.values()];
    if (status) {
      rows = rows.filter((x) => x.status === status);
    }
    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
      (x) => x.sellerId === sellerId,
    );
    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + limit)
      .map((r) => this.toDto(r));
    return { items, total, page, limit };
  }
}
