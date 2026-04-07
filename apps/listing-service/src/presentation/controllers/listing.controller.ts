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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateListingDto } from '../dto/create-listing.dto';
import { UpdateListingDto } from '../dto/update-listing.dto';
import { DeleteListingDto } from '../dto/delete-listing.dto';
import { ApproveListingDto } from '../dto/approve-listing.dto';
import { RejectListingDto } from '../dto/reject-listing.dto';
import { CreateListingCommand } from '../../application/commands/create-listing/create-listing.command';
import { UpdateListingCommand } from '../../application/commands/update-listing/update-listing.command';
import { ApproveListingCommand } from '../../application/commands/approve-listing/approve-listing.command';
import { RejectListingCommand } from '../../application/commands/reject-listing/reject-listing.command';
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

  /**
   * POST /api/v1/listings
   * UC16 bước 7 — Người bán xác nhận và gửi bài đăng
   * Bài đăng được tạo với status = 'pending' chờ admin kiểm duyệt.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateListingDto) {
    return this.commandBus.execute(
      new CreateListingCommand(
        dto.title,
        dto.description,
        dto.priceVnd,
        dto.sellerId,
        dto.packageType,
        dto.imageUrls,
        dto.carMake,
        dto.carModel,
        dto.carYear,
        dto.mileageKm,
        dto.fuelType,
        dto.transmission,
      ),
    );
  }

  /**
   * GET /api/v1/listings?page=1&limit=20&status=approved
   * Lấy danh sách bài đăng, có thể filter theo status
   */
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

  /**
   * GET /api/v1/listings/seller/:sellerId
   * Lấy danh sách bài đăng của một người bán cụ thể
   */
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

  /**
   * GET /api/v1/listings/:id
   * Xem chi tiết một bài đăng
   */
  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const row = await this.queryBus.execute(new GetListingDetailQuery(id));
    if (!row) {
      throw new NotFoundException('Listing not found');
    }
    return row;
  }

  /**
   * PATCH /api/v1/listings/:id
   * UC16 — Người bán chỉnh sửa bài đăng (khi còn ở trạng thái pending/draft)
   */
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

  /**
   * POST /api/v1/listings/:id/approve
   * UC16 bước 9 — Admin phê duyệt bài đăng → status chuyển 'approved'
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveListingDto,
  ) {
    return this.commandBus.execute(
      new ApproveListingCommand(id, dto.moderatorId),
    );
  }

  /**
   * POST /api/v1/listings/:id/reject
   * UC16 A1 — Admin từ chối / huỷ bài đăng → status chuyển 'rejected'
   * Sau khi reject, hệ thống publish event listing.rejected để
   * notification-service gửi thông báo cho người bán.
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectListingDto,
  ) {
    return this.commandBus.execute(
      new RejectListingCommand(id, dto.moderatorId, dto.reason),
    );
  }

  /**
   * DELETE /api/v1/listings/:id
   * Người bán xoá bài đăng của chính mình
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DeleteListingDto) {
    return this.commandBus.execute(new DeleteListingCommand(id, dto.sellerId));
  }
}
