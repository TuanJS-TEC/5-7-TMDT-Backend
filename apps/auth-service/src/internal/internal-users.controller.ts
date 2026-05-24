import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAccountService } from './admin-account.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';
import { InternalLockAccountDto } from './dto/internal-lock-account.dto';
import { InternalPublicProfileService } from './internal-public-profile.service';

/**
 * API nội bộ — chỉ gọi từ listing-service / gateway với INTERNAL_API_KEY.
 * UC37 — khóa tài khoản vi phạm.
 */
@Controller({ path: 'internal/users', version: '1' })
@UseGuards(InternalApiKeyGuard)
export class InternalUsersController {
  constructor(
    private readonly adminAccount: AdminAccountService,
    private readonly publicProfile: InternalPublicProfileService,
  ) {}

  /** UC4/UC5 — listing-service lấy SĐT & tên người bán */
  @Get(':userId/public-profile')
  @HttpCode(HttpStatus.OK)
  async getPublicProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    const data = await this.publicProfile.getByUserId(userId);
    return { data };
  }

  @Post(':userId/lock')
  @HttpCode(HttpStatus.OK)
  async lockAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: InternalLockAccountDto,
  ) {
    const result = await this.adminAccount.lockAccount(userId, {
      reason: dto.reason,
      lockUntil: dto.lockUntil ?? null,
      moderatorId: dto.moderatorId,
    });
    return { data: result };
  }
}
