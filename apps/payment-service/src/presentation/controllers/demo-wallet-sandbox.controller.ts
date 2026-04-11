import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { DemoWalletService } from '../../infrastructure/wallet/demo-wallet.service';
import { EWalletWebhookService } from '../../infrastructure/wallet/e-wallet-webhook.service';
import { PaymentReadRepository } from '../../infrastructure/persistence/read/payment.read.repository';

/**
 * UC29 — Trang thanh toán ví **sandbox** (miễn phí, thay MoMo/ZaloPay API thật).
 * Không cần đăng nhập — truy cập bằng URL đã ký (payUrl từ init).
 */
@Controller('payments/demo-wallet')
export class DemoWalletSandboxController {
  constructor(
    private readonly demoWallet: DemoWalletService,
    private readonly eWalletWebhook: EWalletWebhookService,
    private readonly readRepo: PaymentReadRepository,
  ) {}

  @Get('pay')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async payPage(
    @Query('orderId') orderId: string,
    @Query('exp') expRaw: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    const exp = Number(expRaw);
    if (!orderId || !sig || !Number.isFinite(exp)) {
      throw new BadRequestException('Thiếu tham số orderId, exp hoặc sig.');
    }
    if (!this.demoWallet.verifyPayPageQuery(orderId, exp, sig)) {
      res
        .status(400)
        .send(this.htmlMessage('Liên kết không hợp lệ hoặc đã hết hạn.', false));
      return;
    }

    const order = await this.readRepo.findById(orderId);
    if (!order) {
      res.status(404).send(this.htmlMessage('Không tìm thấy đơn hàng.', false));
      return;
    }

    const label = this.demoWallet.providerLabel(order.paymentMethod);
    const base = this.demoWallet.getPublicApiBase();
    const q = (outcome: string) =>
      `${base}/payments/demo-wallet/complete?orderId=${encodeURIComponent(orderId)}&exp=${exp}&sig=${encodeURIComponent(sig)}&outcome=${outcome}`;

    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>Demo ${label}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:16px}
.card{border:1px solid #ddd;border-radius:12px;padding:20px;background:#fafafa}
h1{font-size:1.1rem}
.amount{font-size:1.4rem;font-weight:700;color:#0a0}
.btn{display:block;width:100%;padding:12px;margin:8px 0;border-radius:8px;text-align:center;text-decoration:none;font-weight:600;border:none;cursor:pointer}
.ok{background:#16a34a;color:#fff}
.warn{background:#eab308;color:#111}
.err{background:#dc2626;color:#fff}
.muted{color:#666;font-size:0.9rem}
</style></head><body>
<div class="card">
  <h1>Demo ví — ${label} (sandbox)</h1>
  <p class="muted">Đơn: <code>${orderId}</code></p>
  <p>Số tiền: <span class="amount">${order.amountVnd.toLocaleString('vi-VN')} ₫</span></p>
  <p class="muted">Mô phỏng bước 4 UC29: chọn kết quả thanh toán.</p>
  <a class="btn ok" href="${q('success')}">Thanh toán thành công</a>
  <a class="btn warn" href="${q('cancel')}">Hủy (A1)</a>
  <a class="btn err" href="${q('insufficient')}">Không đủ số dư (A2)</a>
</div>
<p class="muted">Đây là cổng thử nghiệm nội bộ — không gọi API MoMo/ZaloPay thật.</p>
</body></html>`;
    res.status(200).send(html);
  }

  @Get('complete')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async complete(
    @Query('orderId') orderId: string,
    @Query('exp') expRaw: string,
    @Query('sig') sig: string,
    @Query('outcome') outcome: string,
    @Res() res: Response,
  ): Promise<void> {
    const exp = Number(expRaw);
    if (!orderId || !sig || !Number.isFinite(exp)) {
      throw new BadRequestException('Thiếu tham số.');
    }
    if (!this.demoWallet.verifyPayPageQuery(orderId, exp, sig)) {
      res.status(400).send(this.htmlMessage('Liên kết không hợp lệ hoặc đã hết hạn.', false));
      return;
    }

    const map: Record<string, 'success' | 'cancel' | 'insufficient'> = {
      success: 'success',
      cancel: 'cancel',
      insufficient: 'insufficient',
    };
    const o = map[outcome];
    if (!o) {
      throw new BadRequestException('outcome không hợp lệ.');
    }

    const result = await this.eWalletWebhook.processSandboxOutcome(orderId, o);
    const ok =
      result.handled &&
      [
        'COMPLETED',
        'CANCELLED',
        'FAILED_INSUFFICIENT',
        'FAILED',
        'IDEMPOTENT_ALREADY_SUCCESS',
      ].includes(result.code);
    const msg =
      result.message ||
      (result.code === 'COMPLETED' || result.code === 'IDEMPOTENT_ALREADY_SUCCESS'
        ? 'Thanh toán thành công. Bạn có thể đóng trang này.'
        : `${result.code}`);
    res.status(ok ? 200 : 400).send(this.htmlMessage(msg, ok));
  }

  private htmlMessage(text: string, ok: boolean): string {
    const color = ok ? '#16a34a' : '#b91c1c';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Kết quả</title></head>
<body style="font-family:system-ui;padding:32px"><p style="color:${color}">${this.escapeHtml(text)}</p></body></html>`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
