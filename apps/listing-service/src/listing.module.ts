import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingOrmEntity } from './infrastructure/persistence/typeorm/listing.orm.entity';
import { ListingController } from './presentation/controllers/listing.controller';
import { CreateListingHandler } from './application/commands/create-listing/create-listing.handler';
import { UpdateListingHandler } from './application/commands/update-listing/update-listing.handler';
import { UpdateListingCommand } from './application/commands/update-listing/update-listing.command';
import { ApproveListingHandler } from './application/commands/approve-listing/approve-listing.handler';
import { RejectListingHandler } from './application/commands/reject-listing/reject-listing.handler';
import { DeleteListingHandler } from './application/commands/delete-listing/delete-listing.handler';
import { RequestModificationHandler } from './application/commands/request-modification/request-modification.handler';
import { GetListingDetailHandler } from './application/queries/get-listing-detail/get-listing-detail.handler';
import { GetListingListHandler } from './application/queries/get-listing-list/get-listing-list.handler';
import { GetSellerListingsHandler } from './application/queries/get-seller-listings/get-seller-listings.handler';
import { ListingCreatedHandler } from './application/events/listing-created/listing-created.handler';
import { ListingApprovedHandler } from './application/events/listing-approved/listing-approved.handler';
import { ListingRejectedHandler } from './application/events/listing-rejected/listing-rejected.handler';
import { ListingModificationRequestedHandler } from './application/events/listing-modification-requested/listing-modification-requested.handler';
import { ListingWriteRepository } from './infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from './infrastructure/persistence/read/listing.read.repository';
import { RabbitMqPublisher } from './infrastructure/messaging/rabbitmq.publisher';
import { FAVORITE_STORE, LISTING_STORE } from './infrastructure/persistence/listing.store.token';
import type { ListingRecord } from './infrastructure/persistence/listing-record';
import { SearchListingsHandler } from './application/queries/search-listings/search-listings.handler';
import { FilterListingsHandler } from './application/queries/filter-listings/filter-listings.handler';
import { GetListingPackagesHandler } from './application/queries/get-listing-packages/get-listing-packages.handler';
import { ShareListingHandler } from './application/commands/share-listing/share-listing.handler';
import { ReportListingHandler } from './application/commands/report-listing/report-listing.handler';
import { GetListingStatisticsHandler } from './application/queries/get-listing-statistics/get-listing-statistics.handler';
import { PushListingHandler } from './application/commands/push-listing/push-listing.handler';
import { FeatureListingHandler } from './application/commands/feature-listing/feature-listing.handler';
import { ReportReadRepository } from './infrastructure/persistence/read/report.read.repository';
import { ReportWriteRepository } from './infrastructure/persistence/write/report.write.repository';
import { REPORT_STORE } from './infrastructure/persistence/report.store.token';
import { ReportRecord } from './infrastructure/persistence/report-record';
import { ProfileService } from './infrastructure/auth/profile.service';
import { CompareListingsHandler } from './application/queries/compare-listings/compare-listings.handler';
import { GetListingStatsHandler } from './application/queries/get-listing-stats/get-listing-stats.handler';
import { FavoriteReadRepository } from './infrastructure/persistence/read/favorite.read.repository';
import { FavoriteWriteRepository } from './infrastructure/persistence/write/favorite.write.repository';
import { AddFavoriteHandler } from './application/commands/add-favorite/add-favorite.handler';
import { RemoveFavoriteHandler } from './application/commands/remove-favorite/remove-favorite.handler';
import { GetFavoriteListingsHandler } from './application/queries/get-favorite-listings/get-favorite-listings.handler';
import { ConfigModule } from '@nestjs/config';
import { PaymentPackagePaidConsumer } from './infrastructure/messaging/payment-package-paid.consumer';
import { PaymentRefundCompletedConsumer } from './infrastructure/messaging/payment-refund-completed.consumer';
import { ReportModerationService } from './application/services/report-moderation.service';
import { ReportNotificationService } from './application/services/report-notification.service';
import { SellerWarningService } from './application/services/seller-warning.service';
import { SELLER_WARNING_STORE } from './infrastructure/persistence/seller-warning.store.token';
import { SellerWarningReadRepository } from './infrastructure/persistence/read/seller-warning.read.repository';
import { SellerWarningWriteRepository } from './infrastructure/persistence/write/seller-warning.write.repository';
import { NotificationHttpClient } from './infrastructure/notifications/notification-http.client';
import { AuthAccountHttpClient } from './infrastructure/auth/auth-account-http.client';
import { AccountLockService } from './application/services/account-lock.service';
import { SellerListingsRemovalService } from './application/services/seller-listings-removal.service';
import { UC38_REMOVAL_AUDIT_STORE } from './infrastructure/persistence/uc38-removal-audit.store.token';
import { Uc38RemovalAuditReadRepository } from './infrastructure/persistence/read/uc38-removal-audit.read.repository';
import { Uc38RemovalAuditWriteRepository } from './infrastructure/persistence/write/uc38-removal-audit.write.repository';

const commandHandlers = [
  CreateListingHandler,
  UpdateListingHandler,
  ApproveListingHandler,
  /** UC16 A1 — admin từ chối bài đăng */
  RejectListingHandler,
  RequestModificationHandler,
  DeleteListingHandler,
  ShareListingHandler,
  ReportListingHandler,
  AddFavoriteHandler,
  RemoveFavoriteHandler,
];
const queryHandlers = [
  GetListingDetailHandler,
  GetListingListHandler,
  GetSellerListingsHandler,
  SearchListingsHandler,
  FilterListingsHandler,
  /** UC18 — Lấy danh sách gói đăng tin */
  GetListingPackagesHandler,
  CompareListingsHandler,
  GetFavoriteListingsHandler,
  GetListingStatsHandler,
];
const eventHandlers = [
  ListingCreatedHandler,
  ListingApprovedHandler,
  /** UC16 A1 — publish listing.rejected event → notification-service */
  ListingRejectedHandler,
  /** UC33 — publish listing.modification_requested event → notification-service */
  ListingModificationRequestedHandler,
];

let createMockListingStore: any = () => new Map();
let createMockFavoriteStore: any = () => new Map();
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockListing = require('./infrastructure/persistence/mock-listing.store');
  createMockListingStore = mockListing.createMockListingStore || createMockListingStore;
  createMockFavoriteStore = mockListing.createMockFavoriteStore || createMockFavoriteStore;
} catch (e) { }

let createMockReportStore: any = () => new Map();
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReport = require('./infrastructure/persistence/mock-report.store');
  createMockReportStore = mockReport.createMockReportStore || createMockReportStore;
} catch (e) { }

const typeOrmListing =
  process.env.SKIP_DATABASE === 'true'
    ? []
    : [TypeOrmModule.forFeature([ListingOrmEntity])];

@Module({
  // imports: [CqrsModule, ...typeOrmListing],
  imports: [
    CqrsModule,
    ConfigModule, // Cần ConfigModule để ProfileService đọc biến môi trường
    HttpModule, // Cần HttpModule để ProfileService có thể gọi HTTP request
    ...typeOrmListing,
  ],
  controllers: [ListingController],
  providers: [
    {
      provide: LISTING_STORE,
      useFactory: createMockListingStore,
    },
    {
      provide: REPORT_STORE,
      useFactory: createMockReportStore,
    },
    {
      provide: SELLER_WARNING_STORE,
      useFactory: () => new Map(),
    },
    {
      provide: UC38_REMOVAL_AUDIT_STORE,
      useFactory: () => new Map(),
    },
    ListingWriteRepository,
    ListingReadRepository,
    ReportReadRepository,
    ReportWriteRepository,
    {
      provide: FAVORITE_STORE,
      useFactory: createMockFavoriteStore,
    },
    FavoriteReadRepository,
    FavoriteWriteRepository,
    RabbitMqPublisher,
    PaymentPackagePaidConsumer,
    PaymentRefundCompletedConsumer,
    ProfileService,
    ReportModerationService,
    ReportNotificationService,
    SellerWarningReadRepository,
    SellerWarningWriteRepository,
    NotificationHttpClient,
    AuthAccountHttpClient,
    SellerWarningService,
    Uc38RemovalAuditReadRepository,
    Uc38RemovalAuditWriteRepository,
    SellerListingsRemovalService,
    AccountLockService,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class ListingModule { }
