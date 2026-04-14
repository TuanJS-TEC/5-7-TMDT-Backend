import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { VietQrWebhookService } from '../../infrastructure/vietqr/vietqr-webhook.service';
import { VietQrWebhookDto } from '../dto/vietqr-webhook.dto';
import { EWalletWebhookService } from '../../infrastructure/wallet/e-wallet-webhook.service';
import { EWalletWebhookDto } from '../dto/e-wallet-webhook.dto';
import { AtmBankingWebhookService } from '../../infrastructure/atm/atm-banking-webhook.service';
import { AtmBankingWebhookDto } from '../dto/atm-banking-webhook.dto';
import { RefundWebhookService } from '../../infrastructure/refund/refund-webhook.service';
import { RefundWebhookDto } from '../dto/refund-webhook.dto';

/**
 * UC31 — Webhook cổng thanh toán (xác thực chữ ký, khớp order/amount, cập nhật đơn)
 * Được gọi từ UC28 bước 6–7.
 */
@Controller('payments/webhooks')
export class PaymentWebhookController {
  constructor(
    private readonly vietQrWebhook: VietQrWebhookService,
    private readonly eWalletWebhook: EWalletWebhookService,
    private readonly atmBankingWebhook: AtmBankingWebhookService,
    private readonly refundWebhook: RefundWebhookService,
  ) {}

  @Post('vietqr')
  @HttpCode(200)
  async handleVietQr(@Body() body: VietQrWebhookDto) {
    const result = await this.vietQrWebhook.process({
      order_id: body.order_id,
      transaction_id: body.transaction_id,
      amount: body.amount,
      status: body.status,
      timestamp: body.timestamp,
      signature: body.signature,
      transfer_content: body.transfer_content,
    });
    return { success: true, ...result };
  }

  /**
   * UC29 — IPN ví điện tử (Demo Sandbox hoặc tích hợp cổng thật sau này).
   * UC31 — HMAC-SHA256 trên payload; UC29 A4 — sai chữ ký → 400 + theo dõi IP.
   */
  @Post('e-wallet')
  @HttpCode(200)
  async handleEWallet(@Body() body: EWalletWebhookDto, @Ip() ip: string) {
    const clientIp = ip || '0.0.0.0';
    const result = await this.eWalletWebhook.processIpn(
      {
        order_id: body.order_id,
        trans_id: body.trans_id,
        amount: body.amount,
        result_code: body.result_code,
        message: body.message,
        timestamp: body.timestamp,
        signature: body.signature,
      },
      clientIp,
    );
    return { success: true, ...result };
  }

  /**
   * UC30 — IPN cổng ATM/Internet Banking (demo hoặc VNPay/PayOS thật sau này).
   */
  @Post('atm-banking')
  @HttpCode(200)
  async handleAtmBanking(@Body() body: AtmBankingWebhookDto, @Ip() ip: string) {
    const clientIp = ip || '0.0.0.0';
    const result = await this.atmBankingWebhook.processIpn(
      {
        order_id: body.order_id,
        transaction_no: body.transaction_no,
        amount: body.amount,
        response_code: body.response_code,
        bank_code: body.bank_code,
        message: body.message ?? '',
        timestamp: body.timestamp,
        secure_hash: body.secure_hash,
      },
      clientIp,
    );
    return { success: true, ...result };
  }

  /**
   * UC34 bước 3–4 — Callback từ cổng khi hoàn tiền bất đồng bộ (tích hợp thật hoặc test thủ công).
   */
  @Post('refund')
  @HttpCode(200)
  async handleRefund(@Body() body: RefundWebhookDto) {
    const result = await this.refundWebhook.process(body);
    return { success: true, ...result };
  }
}
