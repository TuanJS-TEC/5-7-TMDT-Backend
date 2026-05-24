import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard, SellerGuard, JwtRequestUser } from '@car-marketplace/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { ListingImageService } from '../../application/listing-image/listing-image.service';
import { ManualImageReviewDto } from '../dto/manual-image-review.dto';
import { UploadListingImageBodyDto } from '../dto/upload-listing-image-body.dto';

@Controller({ path: 'listings', version: '1' })
export class ListingImageController {
  constructor(private readonly listingImage: ListingImageService) {}

  /** UC17 — link upload (multipart) cho người bán */
  @Get(':id/images/upload-instructions')
  @UseGuards(JwtAuthGuard, SellerGuard)
  getUploadInstructions(
    @Param('id', ParseUUIDPipe) listingId: string,
    @Req() req: Request,
  ) {
    const proto = req.headers['x-forwarded-proto']?.toString() ?? req.protocol;
    const host = req.headers['x-forwarded-host']?.toString() ?? req.get('host');
    const publicBase = `${proto}://${host}`;
    return this.listingImage.getUploadInstructions(listingId, publicBase);
  }

  /** UC17 — upload ảnh + gọi AI */
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, SellerGuard)
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @Param('id', ParseUUIDPipe) listingId: string,
    @Req() req: { user: JwtRequestUser },
    @Body() _body: UploadListingImageBodyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.listingImage.uploadAndValidate(
      listingId,
      req.user.userId,
      file as Express.Multer.File,
    );
  }

  /** UC17 A1 — QTV duyệt / từ chối ảnh chờ */
  @Post(':id/images/manual-review')
  @HttpCode(200)
  manualReview(
    @Param('id', ParseUUIDPipe) listingId: string,
    @Body() dto: ManualImageReviewDto,
  ) {
    return this.listingImage.manualReview(
      listingId,
      dto.moderatorId.trim(),
      dto.approve,
      dto.rejectListing,
    );
  }
}
