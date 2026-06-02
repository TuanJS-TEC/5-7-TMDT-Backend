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
import { FavoriteOrmEntity } from './infrastructure/persistence/typeorm/favorite.orm.entity';
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
import { ReportRecord } from './infrastructure/persistence/report-record';
import { ReportOrmEntity } from './infrastructure/persistence/typeorm/report.orm.entity';
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
import { MarkListingSoldCommand } from './application/commands/mark-listing-sold/mark-listing-sold.command';
import { MarkListingSoldHandler } from './application/commands/mark-listing-sold/mark-listing-sold.handler';
import { ListingSoldEventHandler } from './application/events/listing-sold/listing-sold.handler';
import { GetMyListingsHandler } from './application/queries/get-my-listings/get-my-listings.handler';
import { GetAdminSoldListingsHandler } from './application/queries/get-admin-sold-listings/get-admin-sold-listings.handler';
import { RenewListingCommand } from './application/commands/renew-listing/renew-listing.command';
import { RenewListingHandler } from './application/commands/renew-listing/renew-listing.handler';
import { RenewListingDto } from './presentation/dto/renew-listing.dto';
import { ListingRenewedEvent } from './application/events/listing-renewed/listing-renewed.event';
import { PaymentServiceHttpClient } from './infrastructure/payment/payment-service-http.client';
import { ListingExpirationService } from './application/services/listing-expiration.service';
import { ListingExpirationNotificationService } from './application/services/listing-expiration-notification.service';
import { ListingExpirationCron } from './infrastructure/scheduling/listing-expiration.cron';
import { ListingAuthModule } from './auth/listing-auth.module';
import { ListingImageController } from './presentation/controllers/listing-image.controller';
import { ListingImageService } from './application/listing-image/listing-image.service';
import { AiImageValidationClient } from './infrastructure/ai/ai-image-validation.client';
import { CarMakeOrmEntity } from './infrastructure/persistence/typeorm/car-make.orm.entity';
import { CarMakeReadRepository } from './infrastructure/persistence/read/car-make.read.repository';
import { CarMakeSeedService } from './infrastructure/persistence/car-make.seed.service';

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
  /** UC21 — Đẩy tin lên top */
  PushListingHandler,
  /** UC22 — Ghim tin nổi bật */
  FeatureListingHandler,
  MarkListingSoldHandler,
  RenewListingHandler,
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
  /** UC20 — Xem thống kê tin đăng */
  GetListingStatisticsHandler,
  GetMyListingsHandler,
  GetAdminSoldListingsHandler,
];
const eventHandlers = [
  ListingCreatedHandler,
  ListingApprovedHandler,
  /** UC16 A1 — publish listing.rejected event → notification-service */
  ListingRejectedHandler,
  /** UC33 — publish listing.modification_requested event → notification-service */
  ListingModificationRequestedHandler,
  /** UC25 — publish listing.sold → notification-service */
  ListingSoldEventHandler,
];

const typeOrmListing =
  process.env.SKIP_DATABASE === 'true'
    ? []
    : [TypeOrmModule.forFeature([ListingOrmEntity, FavoriteOrmEntity, ReportOrmEntity, CarMakeOrmEntity])];

@Module({
  // imports: [CqrsModule, ...typeOrmListing],
  imports: [
    CqrsModule,
    ListingAuthModule,
    ConfigModule, // Cần ConfigModule để ProfileService đọc biến môi trường
    HttpModule, // Cần HttpModule để ProfileService có thể gọi HTTP request
    ...typeOrmListing,
  ],
  controllers: [ListingController, ListingImageController],
  providers: [
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
    FavoriteReadRepository,
    FavoriteWriteRepository,
    CarMakeReadRepository,
    CarMakeSeedService,
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
    PaymentServiceHttpClient,
    ListingExpirationService,
    ListingExpirationNotificationService,
    ListingExpirationCron,
    ListingImageService,
    AiImageValidationClient,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class ListingModule { }
