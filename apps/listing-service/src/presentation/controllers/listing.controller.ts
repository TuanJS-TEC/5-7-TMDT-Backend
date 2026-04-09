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
import { CreateListingCommand } from '../../application/commands/create-listing/create-listing.command';
import { UpdateListingCommand } from '../../application/commands/update-listing/update-listing.command';
import { ApproveListingCommand } from '../../application/commands/approve-listing/approve-listing.command';
import { RejectListingCommand } from '../../application/commands/reject-listing/reject-listing.command';
import { DeleteListingCommand } from '../../application/commands/delete-listing/delete-listing.command';
import { GetListingDetailQuery } from '../../application/queries/get-listing-detail/get-listing-detail.query';
import { GetListingListQuery } from '../../application/queries/get-listing-list/get-listing-list.query';
import { GetSellerListingsQuery } from '../../application/queries/get-seller-listings/get-seller-listings.query';
import { ListingReadRepository } from '../../infrastructure/persistence/read/listing.read.repository';
import { SearchListingsQuery } from '../../application/queries/search-listings/search-listings.query';
import { FilterListingsQuery } from '../../application/queries/filter-listings/filter-listings.query';
import { CompareListingsQuery } from '../../application/queries/compare-listings/compare-listings.query';
import { AddFavoriteCommand } from '../../application/commands/add-favorite/add-favorite.command';
import { RemoveFavoriteCommand } from '../../application/commands/remove-favorite/remove-favorite.command';
import { GetFavoriteListingsQuery } from '../../application/queries/get-favorite-listings/get-favorite-listings.query';
import { ConfigService } from '@nestjs/config'; // Thêm ConfigService để lấy URL của Auth Service
import { ProfileService } from '../../infrastructure/auth/profile.service';

@Controller({ path: 'listings', version: '1' })
export class ListingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly listingReadRepository: ListingReadRepository, // Để truy cập trực tiếp cho UC4
    private readonly profileService: ProfileService, // Inject ProfileService để lấy thông tin người bán
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
  // @Get()
  // list(
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  //   @Query('status') status?: string,
  // ) {
  //   return this.queryBus.execute(
  //     new GetListingListQuery(page, limit, status),
  //   );
  // }
  @Get()
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.queryBus.execute(
      new GetListingListQuery(page, limit, status, sortBy, sortOrder),
    );
  }

  /**
   * GET /api/v1/listings/search?keyword=toyota&page=1&limit=10
   * UC2: Tìm kiếm xe theo từ khóa
   */
  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
  ) {
    if (!keyword) {
      throw new BadRequestException('Keyword is required for search');
    }
    return this.queryBus.execute(
      new SearchListingsQuery(keyword, page, limit, sortBy, sortOrder),
    );
  }

  /**
   * GET /api/v1/listings/filter?minPrice=...&maxPrice=...&carMake=...&carYear=...&page=1&limit=10
   * UC3: Lọc xe nâng cao
   */
  @Get('filter')
  async filter(
    @Query('minPrice', new DefaultValuePipe(0), ParseIntPipe) minPrice: number,
    @Query('maxPrice', new DefaultValuePipe(9999999999), ParseIntPipe) maxPrice: number,
    @Query('minYear', new DefaultValuePipe(1900), ParseIntPipe) minYear: number,
    @Query('maxYear', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) maxYear: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('carMake') carMake?: string,
    @Query('carModel') carModel?: string,
    @Query('fuelType') fuelType?: string,
    @Query('transmission') transmission?: string,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.queryBus.execute(
      new FilterListingsQuery(
        minPrice,
        maxPrice,
        minYear,
        maxYear,
        page,
        limit,
        carMake,
        carModel,
        fuelType,
        transmission,
        sortBy,
        sortOrder,
      ),
    );
  }

  /**
   * GET /api/v1/listings/compare?ids=id1,id2,id3
   * UC7: So sánh xe (tối đa 3 xe)
   */
  @Get('compare')
  async compareListings(@Query('ids') idsString: string) {
    if (!idsString) {
      throw new BadRequestException('Vui lòng cung cấp danh sách ID xe cần so sánh qua tham số ?ids=');
    }

    const ids = idsString.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
    
    if (ids.length > 3) {
      throw new BadRequestException('Chỉ hỗ trợ so sánh tối đa 3 xe.');
    }
    
    if (ids.length === 0) {
       throw new BadRequestException('Danh sách ID không hợp lệ.');
    }

    // Giả lập tracking (UC7)
    console.log(`Mock: Tracking - Người dùng đang so sánh các xe có ID: ${ids.join(', ')}`);

    const listings = await this.queryBus.execute(new CompareListingsQuery(ids));
    return listings;
  }

  /**
   * GET /api/v1/listings/favorites?userId=xxx
   * UC8: Lấy danh sách xe yêu thích của người dùng
   */
  @Get('favorites')
  async getFavorites(@Query('userId', ParseUUIDPipe) userId: string) {
    // Giả lập tracking (UC8)
    console.log(`Mock: Tracking - Người dùng ${userId} đang xem danh sách xe yêu thích`);
    return this.queryBus.execute(new GetFavoriteListingsQuery(userId));
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
  // @Get(':id')
  // async getOne(@Param('id', ParseUUIDPipe) id: string) {
  //   const row = await this.queryBus.execute(new GetListingDetailQuery(id));
  //   if (!row) {
  //     throw new NotFoundException('Listing not found');
  //   }
  //   return row;
  // }
  /**
   * GET /api/v1/listings/:id
   * UC4: Xem chi tiết một bài đăng
   */
  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    // Lấy thông tin chi tiết listing
    const listing = await this.queryBus.execute(new GetListingDetailQuery(id));

    if (!listing || listing.status !== 'approved') { // Kiểm tra status của tin
      throw new NotFoundException('Tin đăng này không tồn tại hoặc đã bị gỡ.'); // UC4 A1
    }
    const rawListing = await this.listingReadRepository.findById(id); // Lấy raw record để update
    if (rawListing) {
        console.log(`Mock: Tăng viewCount cho listing ${id}`);
        // await this.listingWriteRepository.update(id, { viewCount: (rawListing.viewCount ?? 0) + 1 });
    }


    // --- Lấy thông tin người bán từ Auth Service ---
    // Gọi Auth Service để lấy thông tin public profile của người bán
    // API Gateway sẽ proxy request này đến Auth Service
    const sellerInfo = await this.profileService.getPublicSellerProfile(listing.sellerId);

    // Trả về dữ liệu kết hợp
    return {
      ...listing,
      seller: sellerInfo || { id: listing.sellerId, fullName: 'Người bán ẩn danh', accountType: 'individual', displayPhone: '******' }, // Mock nếu không tìm thấy
    };
  }

  /**
   * GET /api/v1/listings/:id/phone
   * UC5: Xem số điện thoại người bán
   */
  @Get(':id/phone')
  async getSellerPhone(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.queryBus.execute(new GetListingDetailQuery(id));
    if (!listing || listing.status !== 'approved') {
      throw new NotFoundException('Tin đăng này không tồn tại hoặc đã bị gỡ.');
    }

    console.log(`Mock: Tracking - Người dùng xem số điện thoại của tin đăng ${id}`);

    const sellerInfo = await this.profileService.getPublicSellerProfile(listing.sellerId);
    if (!sellerInfo || !sellerInfo.fullPhone) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ của người bán.');
    }

    return {
      phone: sellerInfo.fullPhone,
    };
  }

  /**
   * POST /api/v1/listings/:id/favorite
   * UC8: Thêm xe vào danh sách yêu thích
   */
  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  async addFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    const listing = await this.queryBus.execute(new GetListingDetailQuery(id));
    if (!listing || listing.status !== 'approved') {
      throw new NotFoundException('Tin đăng không tồn tại hoặc chưa được duyệt.');
    }
    
    // Giả lập tracking (UC8)
    console.log(`Mock: Tracking - Người dùng ${userId} đã lưu xe ${id} vào Mục Yêu Thích`);
    
    await this.commandBus.execute(new AddFavoriteCommand(userId, id));
    return { success: true, message: 'Đã lưu xe vào danh sách yêu thích.' };
  }

  /**
   * DELETE /api/v1/listings/:id/favorite
   * UC8: Xóa xe khỏi danh sách yêu thích
   */
  @Delete(':id/favorite')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    // Giả lập tracking (UC8)
    console.log(`Mock: Tracking - Người dùng ${userId} đã xoá xe ${id} khỏi Danh Sách Yêu Thích`);
    
    await this.commandBus.execute(new RemoveFavoriteCommand(userId, id));
    return { success: true, message: 'Đã bỏ lưu xe khỏi danh sách yêu thích.' };
  }

  /**
   * GET /api/v1/listings/:id/zalo
   * UC6: Chat Zalo với người bán
   */
  @Get(':id/zalo')
  async getZaloLink(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.queryBus.execute(new GetListingDetailQuery(id));
    if (!listing || listing.status !== 'approved') {
      throw new NotFoundException('Tin đăng này không tồn tại hoặc đã bị gỡ.');
    }

    console.log(`Mock: Tracking - Người dùng click chat Zalo của tin đăng ${id}`);

    const sellerInfo = await this.profileService.getPublicSellerProfile(listing.sellerId);
    if (!sellerInfo || !sellerInfo.fullPhone) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ của người bán.');
    }

    return {
      zaloUrl: `https://zalo.me/${sellerInfo.fullPhone}`,
    };
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
