import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingOrmEntity } from './infrastructure/persistence/typeorm/listing.orm.entity';
import { ListingController } from './presentation/controllers/listing.controller';
import { CreateListingHandler } from './application/commands/create-listing/create-listing.handler';
import { UpdateListingHandler } from './application/commands/update-listing/update-listing.handler';
import { ApproveListingHandler } from './application/commands/approve-listing/approve-listing.handler';
import { DeleteListingHandler } from './application/commands/delete-listing/delete-listing.handler';
import { GetListingDetailHandler } from './application/queries/get-listing-detail/get-listing-detail.handler';
import { GetListingListHandler } from './application/queries/get-listing-list/get-listing-list.handler';
import { GetSellerListingsHandler } from './application/queries/get-seller-listings/get-seller-listings.handler';
import { ListingCreatedHandler } from './application/events/listing-created/listing-created.handler';
import { ListingApprovedHandler } from './application/events/listing-approved/listing-approved.handler';
import { ListingWriteRepository } from './infrastructure/persistence/write/listing.write.repository';
import { ListingReadRepository } from './infrastructure/persistence/read/listing.read.repository';
import { RabbitMqPublisher } from './infrastructure/messaging/rabbitmq.publisher';
import { LISTING_STORE } from './infrastructure/persistence/listing.store.token';
import type { ListingRecord } from './infrastructure/persistence/listing-record';

const commandHandlers = [
  CreateListingHandler,
  UpdateListingHandler,
  ApproveListingHandler,
  DeleteListingHandler,
];
const queryHandlers = [
  GetListingDetailHandler,
  GetListingListHandler,
  GetSellerListingsHandler,
];
const eventHandlers = [ListingCreatedHandler, ListingApprovedHandler];

const typeOrmListing =
  process.env.SKIP_DATABASE === 'true'
    ? []
    : [TypeOrmModule.forFeature([ListingOrmEntity])];

@Module({
  imports: [CqrsModule, ...typeOrmListing],
  controllers: [ListingController],
  providers: [
    {
      provide: LISTING_STORE,
      useFactory: (): Map<string, ListingRecord> => new Map(),
    },
    ListingWriteRepository,
    ListingReadRepository,
    RabbitMqPublisher,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class ListingModule {}
