import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentReadRepository } from '../../infrastructure/persistence/read/payment.read.repository';
import { VietQrService } from '../../infrastructure/vietqr/vietqr.service';
import { VietQrWebhookService } from '../../infrastructure/vietqr/vietqr-webhook.service';

/**
 * UC28 (dev) — Trang HTML + mô phỏng thanh toán VietQR thành công.
 * GET  /api/v1/payments/demo-vietqr/orders/:orderId
 * GET  /api/v1/payments/demo-vietqr/orders/:orderId/complete?outcome=success
 */
@Controller('payments/demo-vietqr')
export class DemoVietQrSandboxController {
  constructor(
    private readonly readRepo: PaymentReadRepository,
    private readonly vietQr: VietQrService,
    private readonly vietQrWebhook: VietQrWebhookService,
    private readonly config: ConfigService,
  ) {}

  @Get('orders/:orderId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async viewOrderQr(
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ): Promise<void> {
    const order = await this.requireQrOrder(orderId);
    const rawImage =
      order.vietQrImageUrl?.startsWith('http://') ||
      order.vietQrImageUrl?.startsWith('https://')
        ? order.vietQrImageUrl
        : this.vietQr.getDemoImageAbsoluteUrl();
    const imageUrl = this.escapeHtml(rawImage);
    const transferContent = this.escapeHtml(
      order.transferContent ?? order.id,
    );
    const bankName = this.escapeHtml(
      this.config.get<string>('VIETQR_BANK_NAME', this.vietQr.bankName),
    );
    const amount = order.amountVnd.toLocaleString('vi-VN');
    const status = this.escapeHtml(order.status);
    const completeUrl = this.escapeHtml(
      `/api/v1/payments/demo-vietqr/orders/${orderId}/complete?outcome=success`,
    );
    const isPending = order.status === 'pending';

    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>VietQR — ${orderId}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:420px;margin:32px auto;padding:16px;background:#f8fafc}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;text-align:center;box-shadow:0 4px 24px rgba(15,23,42,.06)}
h1{font-size:1.1rem;margin:0 0 8px;color:#0f172a}
.amount{font-size:1.35rem;font-weight:700;color:#059669;margin:8px 0}
.qr{width:min(100%,280px);border-radius:12px;border:1px solid #e2e8f0}
.meta{text-align:left;font-size:.9rem;color:#475569;margin-top:16px;line-height:1.6}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.85rem}
.btn{display:block;width:100%;padding:12px;margin:12px 0 0;border-radius:8px;text-align:center;text-decoration:none;font-weight:600;border:none;cursor:pointer;font-size:.95rem}
.ok{background:#16a34a;color:#fff}
.ok:disabled{background:#94a3b8;cursor:not-allowed}
.muted{color:#94a3b8;font-size:.8rem;margin-top:16px}
</style></head><body>
<div class="card">
  <h1>Quét mã VietQR để thanh toán</h1>
  <p class="muted">${bankName}</p>
  <p class="amount">${amount} ₫</p>
  <img class="qr" src="${imageUrl}" alt="Mã VietQR thanh toán" width="280" height="280"/>
  <div class="meta">
    <div><strong>Nội dung CK:</strong> <code>${transferContent}</code></div>
    <div><strong>Mã đơn:</strong> <code>${this.escapeHtml(orderId)}</code></div>
    <div><strong>Trạng thái:</strong> ${status}</div>
  </div>
  ${isPending ? `<a class="btn ok" href="${completeUrl}">✓ Mô phỏng thanh toán thành công (dev)</a>` : `<p class="muted">Đơn đã xử lý — không cần thanh toán thêm.</p>`}
</div>
<p class="muted">Sandbox UC28 — chỉ dùng trong môi trường dev/demo.</p>
</body></html>`;
    res.status(200).send(html);
  }

  @Get('orders/:orderId/complete')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async complete(
    @Param('orderId') orderId: string,
    @Query('outcome') outcome: string,
    @Res() res: Response,
  ): Promise<void> {
    if (outcome !== 'success') {
      throw new BadRequestException('Chỉ hỗ trợ outcome=success trong sandbox.');
    }
    if (!this.vietQr.isDemoModeEnabled()) {
      res.status(403).send(this.htmlMessage('PAYMENT_DEMO_MODE đã tắt.', false));
      return;
    }

    const result = await this.vietQrWebhook.processSandboxSuccess(orderId);
    const ok =
      result.handled &&
      ['COMPLETED', 'IDEMPOTENT_ALREADY_SUCCESS'].includes(result.code);
    const msg =
      result.message ||
      (ok
        ? 'Thanh toán thành công! Gói tin sẽ được kích hoạt qua RabbitMQ. Bạn có thể đóng trang và bấm Làm mới trên app.'
        : `${result.code}`);
    res.status(ok ? 200 : 400).send(this.htmlMessage(msg, ok));
  }

  /** Dev API — gọi từ SellerOrdersPage (không cần mở tab sandbox). */
  @Post('orders/:orderId/simulate-success')
  async simulateSuccessApi(@Param('orderId') orderId: string) {
    if (!this.vietQr.isDemoModeEnabled()) {
      throw new BadRequestException({
        code: 'DEMO_MODE_DISABLED',
        message: 'Mô phỏng thanh toán chỉ bật khi PAYMENT_DEMO_MODE=true.',
      });
    }
    await this.requireQrOrder(orderId);
    const result = await this.vietQrWebhook.processSandboxSuccess(orderId);
    return { success: result.handled, ...result };
  }

  private async requireQrOrder(orderId: string) {
    const order = await this.readRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn thanh toán.');
    }
    if (order.paymentMethod !== 'qr_banking') {
      throw new BadRequestException('Đơn không dùng phương thức VietQR.');
    }
    return order;
  }

  private htmlMessage(text: string, ok: boolean): string {
    const color = ok ? '#16a34a' : '#b91c1c';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Kết quả</title></head>
<body style="font-family:system-ui;padding:32px"><p style="color:${color}">${this.escapeHtml(text)}</p>
<p style="color:#64748b;font-size:.9rem">Quay lại trang Đơn thanh toán gói tin và bấm Làm mới.</p></body></html>`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
