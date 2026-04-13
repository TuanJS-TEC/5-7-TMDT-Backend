import { FeatureListingCommand } from '../../application/commands/feature-listing/feature-listing.command';
import { FeatureListingDto } from '../dto/feature-listing.dto';
import { PushListingCommand } from '../../application/commands/push-listing/push-listing.command';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  BadRequestException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateListingDto } from '../dto/create-listing.dto';
import { UpdateListingDto } from '../dto/update-listing.dto';
import { DeleteListingDto } from '../dto/delete-listing.dto';
import { ApproveListingDto } from '../dto/approve-listing.dto';
import { RejectListingDto } from '../dto/reject-listing.dto';
import { RequestModificationDto } from '../dto/request-modification.dto';
import { ReportListingDto } from '../dto/report-listing.dto';
import { CreateListingCommand } from '../../application/commands/create-listing/create-listing.command';
import { UpdateListingCommand } from '../../application/commands/update-listing/update-listing.command';
import { ApproveListingCommand } from '../../application/commands/approve-listing/approve-listing.command';
import { RejectListingCommand } from '../../application/commands/reject-listing/reject-listing.command';
import { RequestModificationCommand } from '../../application/commands/request-modification/request-modification.command';
import { DeleteListingCommand } from '../../application/commands/delete-listing/delete-listing.command';
import { GetListingDetailQuery } from '../../application/queries/get-listing-detail/get-listing-detail.query';
import { GetListingListQuery } from '../../application/queries/get-listing-list/get-listing-list.query';
import { GetSellerListingsQuery } from '../../application/queries/get-seller-listings/get-seller-listings.query';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { SearchListingsQuery } from '../../application/queries/search-listings/search-listings.query';
import { FilterListingsQuery } from '../../application/queries/filter-listings/filter-listings.query';
import { GetListingPackagesQuery } from '../../application/queries/get-listing-packages/get-listing-packages.query';
import { ShareListingCommand } from '../../application/commands/share-listing/share-listing.command';
import { ReportListingCommand } from '../../application/commands/report-listing/report-listing.command';
import { CompareListingsQuery } from '../../application/queries/compare-listings/compare-listings.query';
import { GetListingStatsQuery } from '../../application/queries/get-listing-stats/get-listing-stats.query';
import { AddFavoriteCommand } from '../../application/commands/add-favorite/add-favorite.command';
import { RemoveFavoriteCommand } from '../../application/commands/remove-favorite/remove-favorite.command';
import { GetFavoriteListingsQuery } from '../../application/queries/get-favorite-listings/get-favorite-listings.query';
import { GetListingStatisticsQuery } from '../../application/queries/get-listing-statistics/get-listing-statistics.query';
