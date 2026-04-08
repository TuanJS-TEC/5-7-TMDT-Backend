import { Controller, Get, Post, Body } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPaymentMethodsQuery } from '../../application/queries/get-payment-methods/get-payment-methods.query';
import { CreatePaymentOrderCommand } from '../../application/commands/create-payment-order/create-payment-order.command';
import { CreatePaymentOrderDto } from '../dto/create-payment-order.dto';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /api/v1/payments/methods
   * UC27 — Lấy danh sách các phương thức thanh toán có sẵn
   */
  @Get('methods')
  async getMethods() {
    return this.queryBus.execute(new GetPaymentMethodsQuery());
  }

  /**
   * POST /api/v1/payments/orders
   * UC27 — Tạo đơn thanh toán (chọn phương thức thanh toán)
   */
  @Post('orders')
  async createOrder(@Body() body: CreatePaymentOrderDto) {
    // Trong thực tế sẽ lấy user ID từ request user (authentication middleware)
    const mockUserId = 'user-123';
    
    const command = new CreatePaymentOrderCommand(
      mockUserId,
      body.listingPackageType,
      body.paymentMethod,
      body.amountVnd,
    );
    const orderId = await this.commandBus.execute(command);
    
    return {
      success: true,
      data: {
        orderId,
        status: 'pending',
        message: 'Đơn thanh toán đã được tạo thành công, vui lòng thực hiện thanh toán.',
      },
    };
  }
}
