import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarMakeOrmEntity } from '../typeorm/car-make.orm.entity';
import { CreateCarMakeDto, UpdateCarMakeDto } from '../../../presentation/dto/car-make.dto';

export interface CarMakeDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CarMakeReadRepository {
  constructor(
    @InjectRepository(CarMakeOrmEntity)
    private readonly repo: Repository<CarMakeOrmEntity>,
  ) {}

  private toDto(row: CarMakeOrmEntity): CarMakeDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.isActive,
      showOnHome: row.showOnHome,
      sortOrder: row.sortOrder ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  private async ensureUniqueNameAndSlug(
    name: string,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('m')
      .where('LOWER(m.slug) = LOWER(:slug)', { slug })
      .orWhere('LOWER(m.name) = LOWER(:name)', { name });

    if (excludeId) {
      qb.andWhere('m.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (!existing) {
      return;
    }
    if (existing.slug.toLowerCase() === slug.toLowerCase()) {
      throw new ConflictException('Slug hang xe da ton tai.');
    }
    throw new ConflictException('Ten hang xe da ton tai.');
  }

  async listPublic(): Promise<CarMakeDto[]> {
    const rows = await this.repo.find({
      where: { isActive: true, showOnHome: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((x) => this.toDto(x));
  }

  async listAdmin(): Promise<CarMakeDto[]> {
    const rows = await this.repo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((x) => this.toDto(x));
  }

  async findById(id: string): Promise<CarMakeDto | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDto(row) : null;
  }

  async create(input: CreateCarMakeDto): Promise<CarMakeDto> {
    const name = input.name.trim();
    const slug =
      (input.slug?.trim() || this.slugify(input.name)) ||
      this.slugify(`make-${Date.now()}`);
    await this.ensureUniqueNameAndSlug(name, slug);

    const row = this.repo.create({
      name,
      slug,
      isActive: input.isActive ?? true,
      showOnHome: input.showOnHome ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async update(id: string, input: UpdateCarMakeDto): Promise<CarMakeDto | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    const nextName =
      typeof input.name === 'string' ? input.name.trim() : row.name;
    const nextSlug =
      typeof input.slug === 'string'
        ? input.slug.trim()
        : typeof input.name === 'string'
          ? this.slugify(nextName)
          : row.slug;
    await this.ensureUniqueNameAndSlug(nextName, nextSlug, id);
    row.name = nextName;
    row.slug = nextSlug;
    if (typeof input.isActive === 'boolean') {
      row.isActive = input.isActive;
      if (!row.isActive) {
        row.showOnHome = false;
      }
    }
    if (typeof input.showOnHome === 'boolean') {
      row.showOnHome = row.isActive ? input.showOnHome : false;
    }
    if (typeof input.sortOrder === 'number') {
      row.sortOrder = input.sortOrder;
    }
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
