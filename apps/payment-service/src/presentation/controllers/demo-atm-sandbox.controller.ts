import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { DemoAtmGatewayService } from '../../infrastructure/atm/demo-atm-gateway.service';
import { AtmBankingWebhookService } from '../../infrastructure/atm/atm-banking-webhook.service';
import { PaymentReadRepository } from '../../infrastructure/persistence/read/payment.read.repository';

/**
 * UC30 — Trang cổng thanh toán **sandbox** (ATM / Internet Banking — không bank thật).
 */
@Controller('payments/demo-atm')
export class DemoAtmSandboxController {
  constructor(
    private readonly atmGateway: DemoAtmGatewayService,
    private readonly atmWebhook: AtmBankingWebhookService,
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
    if (!this.atmGateway.verifyPayPageQuery(orderId, exp, sig)) {
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

    const base = this.atmGateway.getPublicApiBase();
    const q = (outcome: string) =>
      `${base}/payments/demo-atm/complete?orderId=${encodeURIComponent(orderId)}&exp=${exp}&sig=${encodeURIComponent(sig)}&outcome=${outcome}`;
    const backUrl = `${base}/payments/demo-atm/back?orderId=${encodeURIComponent(orderId)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;

    const banks = [
      'Vietcombank',
      'Techcombank',
      'BIDV',
      'Agribank',
      'MB Bank',
      'TPBank',
      'VPBank',
      'ACB',
      'Sacombank',
      'SHB',
    ];

    const bankList = banks
      .map((b) => `<li style="margin:4px 0">${this.escapeHtml(b)}</li>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>Demo ATM / Internet Banking</title>
<style>
body{font-family:system-ui,sans-serif;max-width:520px;margin:32px auto;padding:16px}
.card{border:1px solid #ddd;border-radius:12px;padding:20px;background:#fafafa}
h1{font-size:1.15rem}
.amount{font-size:1.35rem;font-weight:700;color:#0a0}
.btn{display:block;width:100%;padding:11px;margin:7px 0;border-radius:8px;text-align:center;text-decoration:none;font-weight:600;font-size:0.95rem}
.ok{background:#16a34a;color:#fff}
.warn{background:#eab308;color:#111}
.err{background:#dc2626;color:#fff}
.neu{background:#64748b;color:#fff}
.muted{color:#666;font-size:0.88rem}
ul{padding-left:20px;max-height:140px;overflow:auto;border:1px solid #e5e5e5;border-radius:8px;background:#fff}
</style></head><body>
<div class="card">
  <h1>Cổng thanh toán (demo — UC30)</h1>
  <p class="muted">Đơn: <code>${this.escapeHtml(orderId)}</code></p>
  <p>Số tiền: <span class="amount">${order.amountVnd.toLocaleString('vi-VN')} ₫</span></p>
  <p class="muted">Bước 3–4 (demo): danh sách ngân hàng nội địa — chọn kết quả mô phỏng bên dưới.</p>
  <ul>${bankList}</ul>
  <p class="muted">Bước 5–6: mô phỏng OTP / xử lý ngân hàng.</p>
  <a class="btn ok" href="${q('success')}">Giao dịch thành công (00)</a>
  <a class="btn warn" href="${q('otp_fail')}">Sai OTP / hết hạn OTP (A1)</a>
  <a class="btn err" href="${q('bank_reject')}">Ngân hàng từ chối (A2)</a>
  <a class="btn neu" href="${q('timeout')}">Timeout cổng 20 phút (A3)</a>
  <a class="btn warn" href="${q('user_cancel')}">Hủy tại cổng</a>
  <a class="btn neu" href="${backUrl}">Quay lại (A4 — không đổi trạng thái đơn)</a>
</div>
<p class="muted">Sandbox nội bộ — không kết nối VNPay/PayOS/ngân hàng thật.</p>
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
    if (!this.atmGateway.verifyPayPageQuery(orderId, exp, sig)) {
      res.status(400).send(this.htmlMessage('Liên kết không hợp lệ hoặc đã hết hạn.', false));
      return;
    }

    const map: Record<string, 'success' | 'otp_fail' | 'bank_reject' | 'timeout' | 'user_cancel'> = {
      success: 'success',
      otp_fail: 'otp_fail',
      bank_reject: 'bank_reject',
      timeout: 'timeout',
      user_cancel: 'user_cancel',
    };
    const o = map[outcome];
    if (!o) {
      throw new BadRequestException('outcome không hợp lệ.');
    }

    const result = await this.atmWebhook.processSandboxOutcome(orderId, o);
    const ok =
      result.handled &&
      [
        'COMPLETED',
        'CANCELLED',
        'FAILED',
        'EXPIRED',
        'IDEMPOTENT_ALREADY_SUCCESS',
      ].includes(result.code);
    const msg =
      result.message ||
      (result.code === 'COMPLETED' || result.code === 'IDEMPOTENT_ALREADY_SUCCESS'
        ? 'Thanh toán thành công.'
        : String(result.code));
    res.status(ok ? 200 : 400).send(this.htmlMessage(msg, ok));
  }

  /** UC30 A4 — Back trình duyệt: đơn vẫn PENDING */
  @Get('back')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async back(
    @Query('orderId') orderId: string,
    @Query('exp') expRaw: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    const exp = Number(expRaw);
    if (!orderId || !sig || !Number.isFinite(exp)) {
      throw new BadRequestException('Thiếu tham số.');
    }
    if (!this.atmGateway.verifyPayPageQuery(orderId, exp, sig)) {
      res.status(400).send(this.htmlMessage('Liên kết không hợp lệ hoặc đã hết hạn.', false));
      return;
    }
    res
      .status(200)
      .send(
        this.htmlMessage(
          'Bạn đã quay lại mà chưa hoàn tất thanh toán. Đơn vẫn ở trạng thái PENDING — có thể mở lại từ lịch sử đơn (UC30 A4).',
          true,
        ),
      );
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
