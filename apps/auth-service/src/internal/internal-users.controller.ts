import {
  Body,
  Controller,
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

/**
 * API nội bộ — chỉ gọi từ listing-service / gateway với INTERNAL_API_KEY.
 * UC37 — khóa tài khoản vi phạm.
 */
@Controller({ path: 'internal/users', version: '1' })
@UseGuards(InternalApiKeyGuard)
export class InternalUsersController {
  constructor(private readonly adminAccount: AdminAccountService) {}

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
