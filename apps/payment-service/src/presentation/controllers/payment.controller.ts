import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { GetPaymentMethodsQuery } from '../../application/queries/get-payment-methods/get-payment-methods.query';
import { CreatePaymentOrderCommand } from '../../application/commands/create-payment-order/create-payment-order.command';
import { CreatePaymentOrderDto } from '../dto/create-payment-order.dto';
import { GenerateVietQrCommand } from '../../application/commands/generate-vietqr/generate-vietqr.command';
import { InitEWalletCommand } from '../../application/commands/init-e-wallet/init-e-wallet.command';
import { InitAtmBankingCommand } from '../../application/commands/init-atm-banking/init-atm-banking.command';
import { GetPaymentOrderQuery } from '../../application/queries/get-payment-order/get-payment-order.query';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SellerGuard } from '../../auth/seller.guard';
import type { JwtRequestUser } from '../../auth/jwt-payload.types';
import { VietQrWebhookService } from '../../infrastructure/vietqr/vietqr-webhook.service';
import { VietQrService } from '../../infrastructure/vietqr/vietqr.service';
import { PaymentReadRepository } from '../../infrastructure/persistence/read/payment.read.repository';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly config: ConfigService,
    private readonly vietQr: VietQrService,
    private readonly vietQrWebhook: VietQrWebhookService,
    private readonly paymentRead: PaymentReadRepository,
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
  @UseGuards(JwtAuthGuard, SellerGuard)
  async createOrder(
    @Req() req: { user: JwtRequestUser },
    @Body() body: CreatePaymentOrderDto,
  ) {
    const command = new CreatePaymentOrderCommand(
      req.user.userId,
      body.listingPackageType,
      body.paymentMethod,
      body.amountVnd,
      body.listingId ?? null,
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

  /**
   * GET /api/v1/payments/orders/:orderId
   * UC28 — Polling trạng thái đơn (QR hết hạn, thanh toán thành công…)
   */
  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard, SellerGuard)
  async getOrder(
    @Req() req: { user: JwtRequestUser },
    @Param('orderId') orderId: string,
  ) {
    const data = await this.queryBus.execute(
      new GetPaymentOrderQuery(orderId, req.user.userId),
    );
    return { success: true, data };
  }

  /**
   * POST /api/v1/payments/orders/:orderId/vietqr
   * UC28 — Tạo / làm mới mã VietQR (cùng order_id, reset bộ đếm 5 phút — luồng phụ A1)
   */
  /**
   * POST /api/v1/payments/orders/:orderId/wallet/init
   * UC29 — Tạo link / QR thanh toán ví (Demo Sandbox — thay MoMo/ZaloPay API thật).
   */
  /**
   * POST /api/v1/payments/orders/:orderId/atm/init
   * UC30 — Tạo URL cổng ATM / Internet Banking (demo sandbox).
   */
  @Post('orders/:orderId/atm/init')
  @UseGuards(JwtAuthGuard, SellerGuard)
  async initAtmBanking(
    @Req() req: { user: JwtRequestUser },
    @Param('orderId') orderId: string,
  ) {
    const data = await this.commandBus.execute(
      new InitAtmBankingCommand(orderId, req.user.userId),
    );
    return {
      success: true,
      data,
      message:
        'Đã tạo phiên thanh toán ATM/Internet Banking (demo). Chuyển hướng tới paymentUrl.',
    };
  }

  @Post('orders/:orderId/wallet/init')
  @UseGuards(JwtAuthGuard, SellerGuard)
  async initEWallet(
    @Req() req: { user: JwtRequestUser },
    @Param('orderId') orderId: string,
  ) {
    const data = await this.commandBus.execute(
      new InitEWalletCommand(orderId, req.user.userId),
    );
    return {
      success: true,
      data,
      message:
        'Đã tạo phiên thanh toán ví. Mở payUrl hoặc hiển thị QR chứa qrPayload.',
    };
  }

  /**
   * POST /api/v1/payments/orders/:orderId/simulate-success
   * UC28 (dev) — mô phỏng webhook VietQR thành công (PAYMENT_DEMO_MODE=true).
   */
  @Post('orders/:orderId/simulate-success')
  @UseGuards(JwtAuthGuard, SellerGuard)
  async simulateVietQrSuccess(
    @Req() req: { user: JwtRequestUser },
    @Param('orderId') orderId: string,
  ) {
    if (this.config.get<string>('PAYMENT_DEMO_MODE', 'true') !== 'true') {
      throw new ForbiddenException({
        code: 'DEMO_MODE_DISABLED',
        message: 'Mô phỏng thanh toán chỉ dùng trong môi trường dev.',
      });
    }
    const order = await this.paymentRead.findById(orderId);
    if (!order || order.userId !== req.user.userId) {
      throw new ForbiddenException('Không có quyền trên đơn này.');
    }
    const result = await this.vietQrWebhook.processSandboxSuccess(orderId);
    return { success: result.handled, ...result };
  }

  @Post('orders/:orderId/vietqr')
  @UseGuards(JwtAuthGuard, SellerGuard)
  async generateVietQr(
    @Req() req: { user: JwtRequestUser },
    @Param('orderId') orderId: string,
  ) {
    const data = await this.commandBus.execute(
      new GenerateVietQrCommand(orderId, req.user.userId),
    );
    return {
      success: true,
      data,
      message:
        'Đã tạo liên kết ảnh QR VietQR. Hiển thị kèm bộ đếm 5 phút trên client.',
    };
  }
}
