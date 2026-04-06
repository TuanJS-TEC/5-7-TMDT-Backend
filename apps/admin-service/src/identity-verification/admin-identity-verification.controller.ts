import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { AdminIdentityVerificationService } from './admin-identity-verification.service';

@Controller('admin/identity-verification')
export class AdminIdentityVerificationController {
  constructor(private readonly service: AdminIdentityVerificationService) {}

  @Get('pending')
  getPendingRequests() {
    return this.service.getPendingRequests();
  }

  @Patch(':requestId/approve')
  approve(
    @Param('requestId') requestId: string,
    @Body() body: { adminId?: string; note?: string },
  ) {
    if (!body.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }

    return this.service.approveRequest(
      requestId,
      body.adminId.trim(),
      body.note?.trim(),
    );
  }

  @Patch(':requestId/reject')
  reject(
    @Param('requestId') requestId: string,
    @Body() body: { adminId?: string; reason?: string },
  ) {
    if (!body.adminId?.trim()) {
      throw new BadRequestException('adminId la bat buoc');
    }
    if (!body.reason?.trim()) {
      throw new BadRequestException('reason la bat buoc');
    }

    return this.service.rejectRequest(
      requestId,
      body.adminId.trim(),
      body.reason.trim(),
    );
  }
}
