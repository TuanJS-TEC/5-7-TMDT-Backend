import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';
import type { JwtRequestUser } from '../../auth/jwt-payload.types';
import { CreateRefundCommand } from '../../application/commands/create-refund/create-refund.command';
import { CreateRefundDto } from '../dto/create-refund.dto';

/**
 * UC34 — Quản trị viên (JWT role=admin) tạo lệnh hoàn tiền.
 * POST /api/v1/payments/admin/refunds
 */
@Controller('payments')
export class PaymentAdminController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('admin/refunds')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createRefund(
    @Req() req: { user: JwtRequestUser },
    @Body() body: CreateRefundDto,
  ) {
    const data = await this.commandBus.execute(
      new CreateRefundCommand(
        body.paymentOrderId,
        body.amountVnd,
        body.reason?.trim() ?? null,
        req.user.userId,
        body.simulateGatewayReject === true,
      ),
    );
    return {
      success: true,
      data,
      message:
        data.status === 'success'
          ? 'Hoàn tiền thành công (demo cổng).'
          : 'Cổng từ chối hoặc lỗi — xem errorMessage (UC34 A1).',
    };
  }
}
