import { INestApplication, ValidationPipe, VersioningType, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ListingController } from '../src/presentation/controllers/listing.controller';
import { JwtAuthGuard } from '@car-marketplace/common';
import { AdminGuard } from '../src/auth/admin.guard';
import { CarMakeReadRepository } from '../src/infrastructure/persistence/read/car-make.read.repository';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ListingReadRepository } from '../src/infrastructure/persistence/read/listing.read.repository';
import { ProfileService } from '../src/infrastructure/auth/profile.service';
import { ReportModerationService } from '../src/application/services/report-moderation.service';
import { SellerWarningReadRepository } from '../src/infrastructure/persistence/read/seller-warning.read.repository';
import { AccountLockService } from '../src/application/services/account-lock.service';
import { SellerListingsRemovalService } from '../src/application/services/seller-listings-removal.service';
import { Uc38RemovalAuditReadRepository } from '../src/infrastructure/persistence/read/uc38-removal-audit.read.repository';
import { ListingExpirationService } from '../src/application/services/listing-expiration.service';

type CarMakeRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

describe('Car makes admin API (e2e)', () => {
  let app: INestApplication<App>;
  let rows: CarMakeRow[];

  const baseTime = '2026-05-28T00:00:00.000Z';
  const now = () => new Date(baseTime).toISOString();
  const makeId = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;

  const repoMock = {
    listPublic: jest.fn(async () =>
      rows.filter((x) => x.isActive && x.showOnHome).sort((a, b) => a.sortOrder - b.sortOrder),
    ),
    listAdmin: jest.fn(async () =>
      rows.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    ),
    findById: jest.fn(async (id: string) => rows.find((x) => x.id === id) ?? null),
    create: jest.fn(async (input: { name: string; slug?: string; isActive?: boolean; showOnHome?: boolean; sortOrder?: number }) => {
      const name = input.name.trim();
      const slug = (input.slug?.trim() || name.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (rows.some((x) => x.slug.toLowerCase() === slug.toLowerCase())) {
        throw new ConflictException('Slug hang xe da ton tai.');
      }
      if (rows.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
        throw new ConflictException('Ten hang xe da ton tai.');
      }
      const row: CarMakeRow = {
        id: makeId(rows.length + 10),
        name,
        slug,
        isActive: input.isActive ?? true,
        showOnHome: input.showOnHome ?? true,
        sortOrder: input.sortOrder ?? 0,
        createdAt: now(),
        updatedAt: now(),
      };
      rows.push(row);
      return row;
    }),
    update: jest.fn(async (id: string, input: { name?: string; slug?: string; isActive?: boolean; showOnHome?: boolean; sortOrder?: number }) => {
      const row = rows.find((x) => x.id === id);
      if (!row) return null;
      const nextName = typeof input.name === 'string' ? input.name.trim() : row.name;
      const nextSlug = typeof input.slug === 'string'
        ? input.slug.trim()
        : typeof input.name === 'string'
          ? nextName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : row.slug;

      if (rows.some((x) => x.id !== id && x.slug.toLowerCase() === nextSlug.toLowerCase())) {
        throw new ConflictException('Slug hang xe da ton tai.');
      }
      if (rows.some((x) => x.id !== id && x.name.toLowerCase() === nextName.toLowerCase())) {
        throw new ConflictException('Ten hang xe da ton tai.');
      }

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
      if (typeof input.sortOrder === 'number') row.sortOrder = input.sortOrder;
      row.updatedAt = now();
      return row;
    }),
    remove: jest.fn(async (id: string) => {
      const idx = rows.findIndex((x) => x.id === id);
      if (idx < 0) return false;
      rows.splice(idx, 1);
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ListingController],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
        { provide: ListingReadRepository, useValue: {} },
        { provide: ProfileService, useValue: {} },
        { provide: ReportModerationService, useValue: {} },
        { provide: SellerWarningReadRepository, useValue: {} },
        { provide: AccountLockService, useValue: {} },
        { provide: SellerListingsRemovalService, useValue: {} },
        { provide: Uc38RemovalAuditReadRepository, useValue: {} },
        { provide: ListingExpirationService, useValue: {} },
        { provide: CarMakeReadRepository, useValue: repoMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    rows = [
      {
        id: makeId(1),
        name: 'Toyota',
        slug: 'toyota',
        isActive: true,
        showOnHome: true,
        sortOrder: 10,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: makeId(2),
        name: 'Honda',
        slug: 'honda',
        isActive: true,
        showOnHome: true,
        sortOrder: 20,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ];
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports admin CRUD flow and detail endpoint', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/listings/admin/car-makes')
      .expect(200);
    expect(listRes.body.items).toHaveLength(2);

    const created = await request(app.getHttpServer())
      .post('/api/v1/listings/admin/car-makes')
      .send({ name: 'Lexus', sortOrder: 30 })
      .expect(201);
    expect(created.body.data.name).toBe('Lexus');

    const newId = created.body.data.id as string;

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/listings/admin/car-makes/${newId}`)
      .expect(200);
    expect(detail.body.data.slug).toBe('lexus');

    await request(app.getHttpServer())
      .patch(`/api/v1/listings/admin/car-makes/${newId}`)
      .send({ name: 'Lexus Premium', showOnHome: false })
      .expect(200);

    const publicList = await request(app.getHttpServer())
      .get('/api/v1/listings/car-makes')
      .expect(200);
    expect(publicList.body.items.some((x: CarMakeRow) => x.name === 'Lexus Premium')).toBe(false);

    await request(app.getHttpServer())
      .delete(`/api/v1/listings/admin/car-makes/${newId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/listings/admin/car-makes/${newId}`)
      .expect(404);
  });

  it('returns 409 when creating duplicate slug', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/listings/admin/car-makes')
      .send({ name: 'Toyota New', slug: 'toyota' })
      .expect(409);
    expect(String(res.body.message)).toContain('Slug hang xe da ton tai');
  });

  it('returns 409 when updating duplicate name', async () => {
    const targetId = makeId(2);
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/listings/admin/car-makes/${targetId}`)
      .send({ name: 'Toyota', slug: 'honda-custom' })
      .expect(409);
    expect(String(res.body.message)).toContain('Ten hang xe da ton tai');
  });

  it('forces showOnHome=false when isActive=false', async () => {
    const targetId = makeId(1);
    await request(app.getHttpServer())
      .patch(`/api/v1/listings/admin/car-makes/${targetId}`)
      .send({ isActive: false, showOnHome: true })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/listings/admin/car-makes/${targetId}`)
      .expect(200);

    expect(detail.body.data.isActive).toBe(false);
    expect(detail.body.data.showOnHome).toBe(false);
  });
});
