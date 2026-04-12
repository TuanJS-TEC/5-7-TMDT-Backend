import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Ip,
  Logger,
  Post,
} from '@nestjs/common';
import { Uc31GatewayWebhookService } from '../../infrastructure/webhook/uc31-gateway-webhook.service';
import { Uc31GatewayWebhookDto } from '../dto/uc31-gateway-webhook.dto';

/**
 * UC31 — Webhook thống nhất từ cổng thanh toán.
 * POST https://[domain]/api/v1/payment/webhook
 *
 * WebSocket / polling UI: client listing-service có thể poll GET orders; WS ngoài phạm vi demo.
 */
@Controller('payment')
export class Uc31PaymentWebhookController {
  private readonly logger = new Logger(Uc31PaymentWebhookController.name);

  constructor(private readonly uc31: Uc31GatewayWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  async handle(@Body() body: Uc31GatewayWebhookDto, @Ip() ip: string) {
    const clientIp = ip || '0.0.0.0';
    try {
      return await this.uc31.process(body, clientIp);
    } catch (e) {
      if (e instanceof Error && e.message === 'UC31_INTERNAL_COMPLETE_FAILED') {
        throw new InternalServerErrorException({
          code: 'INTERNAL_ERROR',
          message: 'Lỗi nội bộ — cổng có thể retry (UC31 A5).',
        });
      }
      if (e instanceof HttpException) {
        throw e;
      }
      this.logger.error(e);
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Lỗi không xác định.',
      });
    }
  }
}
