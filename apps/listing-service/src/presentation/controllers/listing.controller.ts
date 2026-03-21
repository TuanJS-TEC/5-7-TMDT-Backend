import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateListingDto } from '../dto/create-listing.dto';
import { UpdateListingDto } from '../dto/update-listing.dto';
import { DeleteListingDto } from '../dto/delete-listing.dto';
import { ApproveListingDto } from '../dto/approve-listing.dto';
import { CreateListingCommand } from '../../application/commands/create-listing/create-listing.command';
import { UpdateListingCommand } from '../../application/commands/update-listing/update-listing.command';
import { ApproveListingCommand } from '../../application/commands/approve-listing/approve-listing.command';
import { DeleteListingCommand } from '../../application/commands/delete-listing/delete-listing.command';
import { GetListingDetailQuery } from '../../application/queries/get-listing-detail/get-listing-detail.query';
import { GetListingListQuery } from '../../application/queries/get-listing-list/get-listing-list.query';
import { GetSellerListingsQuery } from '../../application/queries/get-seller-listings/get-seller-listings.query';

@Controller({ path: 'listings', version: '1' })
export class ListingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.commandBus.execute(
      new CreateListingCommand(
        dto.title,
        dto.description,
        dto.priceVnd,
        dto.sellerId,
      ),
    );
  }

  @Get()
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.queryBus.execute(
      new GetListingListQuery(page, limit, status),
    );
  }

  @Get('seller/:sellerId')
  listBySeller(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.queryBus.execute(
      new GetSellerListingsQuery(sellerId, page, limit),
    );
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const row = await this.queryBus.execute(new GetListingDetailQuery(id));
    if (!row) {
      throw new NotFoundException('Listing not found');
    }
    return row;
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateListingDto) {
    return this.commandBus.execute(
      new UpdateListingCommand(
        id,
        dto.sellerId,
        dto.title,
        dto.description,
        dto.priceVnd,
      ),
    );
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveListingDto,
  ) {
    return this.commandBus.execute(
      new ApproveListingCommand(id, dto.moderatorId),
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DeleteListingDto) {
    return this.commandBus.execute(new DeleteListingCommand(id, dto.sellerId));
  }
}
