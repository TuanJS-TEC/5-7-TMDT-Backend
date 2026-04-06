import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IdentityVerificationService } from './identity-verification.service';
import type { VerificationStatus } from './identity-verification.types';
import type { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';
import type {
  ApproveIdentityVerificationDto,
  RejectIdentityVerificationDto,
} from './dto/review-identity-verification.dto';

@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly service: IdentityVerificationService) {}

  @Post('requests')
  submit(@Body() dto: SubmitIdentityVerificationDto) {
    return this.service.submitRequest(dto);
  }

  @Get('users/:userId/can-sell')
  getCanSellStatus(@Param('userId') userId: string) {
    return this.service.getCanSellStatus(userId);
  }

  @Get('mock/users')
  getMockUsers() {
    return this.service.listMockUsers();
  }

  @Get('admin/requests')
  getRequests(@Query('status') status?: VerificationStatus) {
    return this.service.listRequests(status);
  }

  @Patch('admin/requests/:requestId/approve')
  approve(
    @Param('requestId') requestId: string,
    @Body() dto: ApproveIdentityVerificationDto,
  ) {
    return this.service.approveRequest(requestId, dto);
  }

  @Patch('admin/requests/:requestId/reject')
  reject(
    @Param('requestId') requestId: string,
    @Body() dto: RejectIdentityVerificationDto,
  ) {
    return this.service.rejectRequest(requestId, dto);
  }
}
