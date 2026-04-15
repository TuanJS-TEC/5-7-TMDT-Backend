import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// import { JwtRequestUser } from '../auth/jwt-payload.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { SellerGuard } from '../auth/seller.guard';
import { JwtRequestUser, SellerGuard } from '@car-marketplace/common';
import { PhoneChangeRequestOtpDto } from './dto/phone-change-request.dto';
import { PhoneChangeVerifyDto } from './dto/phone-change-verify.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { ProfileService } from './profile.service';

@Controller({ path: 'profile', version: '1' })
@UseGuards(JwtAuthGuard, SellerGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('seller')
  getSellerProfile(@Req() req: { user: JwtRequestUser }) {
    return this.profile.getSellerProfile(req.user.userId);
  }

  @Patch('seller')
  @HttpCode(200)
  updateSellerProfile(
    @Req() req: { user: JwtRequestUser },
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.profile.updateSellerProfile(req.user.userId, dto);
  }

  /** UC15 A1 */
  @Post('seller/avatar')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Req() req: { user: JwtRequestUser },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException({
        code: 'AVATAR_REQUIRED',
        message: 'Vui lòng chọn file ảnh (field name: file).',
      });
    }
    return this.profile.uploadAvatarSquare(
      req.user.userId,
      file.buffer,
      file.mimetype,
    );
  }

  /** UC15 A2 */
  @Post('seller/phone-change/request-otp')
  @HttpCode(200)
  requestPhoneChangeOtp(
    @Req() req: { user: JwtRequestUser },
    @Body() dto: PhoneChangeRequestOtpDto,
  ) {
    return this.profile.requestPhoneChangeOtp(req.user.userId, dto.newPhone);
  }

  @Post('seller/phone-change/verify')
  @HttpCode(200)
  verifyPhoneChange(
    @Req() req: { user: JwtRequestUser },
    @Body() dto: PhoneChangeVerifyDto,
  ) {
    return this.profile.verifyPhoneChange(
      req.user.userId,
      dto.newPhone,
      dto.code,
    );
  }
}
