import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const WALLET_SESSION_MS = 15 * 60 * 1000;

/**
 * UC29 — Cổng ví demo (thay MoMo / ZaloPay API thật trong môi trường thử nghiệm).
 * Tạo URL trang thanh toán nội bộ + ký IPN HMAC-SHA256 (cùng chuẩn UC31).
 */
@Injectable()
export class DemoWalletService {
  constructor(private readonly config: ConfigService) {}

  get sessionTtlMs(): number {
    return WALLET_SESSION_MS;
  }

  hasWebhookSecret(): boolean {
    return !!this.getSecret();
  }

  private getSecret(): string {
    return (
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim() ||
      this.config.get<string>('DEMO_WALLET_SECRET')?.trim() ||
      ''
    );
  }

  /** Base URL có prefix /api/v1, ví dụ http://localhost:3004/api/v1 */
  getPublicApiBase(): string {
    const raw =
      this.config.get<string>('PAYMENT_PUBLIC_BASE_URL')?.trim() ||
      'http://localhost:3004/api/v1';
    return raw.replace(/\/$/, '');
  }

  isEWalletMethod(paymentMethod: string): boolean {
    return paymentMethod === 'momo' || paymentMethod === 'zalopay';
  }

  providerLabel(paymentMethod: string): 'MoMo' | 'ZaloPay' {
    return paymentMethod === 'zalopay' ? 'ZaloPay' : 'MoMo';
  }

  buildPayPageUrl(orderId: string, expiresAt: Date): { url: string; exp: number; sig: string } {
    const secret = this.getSecret();
    if (!secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET (hoặc DEMO_WALLET_SECRET) chưa cấu hình.');
    }
    const exp = expiresAt.getTime();
    const sig = this.signPayPage(orderId, exp, secret);
    const base = this.getPublicApiBase();
    const url = `${base}/payments/demo-wallet/pay?orderId=${encodeURIComponent(orderId)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
    return { url, exp, sig };
  }

  verifyPayPageQuery(orderId: string, exp: number, sig: string): boolean {
    const secret = this.getSecret();
    if (!secret) return false;
    if (Date.now() > exp) return false;
    const expected = this.signPayPage(orderId, exp, secret);
    return this.safeEqualHex(expected, sig);
  }

  private signPayPage(orderId: string, exp: number, secret: string): string {
    const canonical = `${orderId}|${exp}`;
    return createHmac('sha256', secret).update(canonical).digest('hex');
  }

  /**
   * UC31 — IPN: order_id|trans_id|amount|result_code|timestamp (chuỗi, result_code số nguyên)
   */
  signIpnPayload(p: {
    order_id: string;
    trans_id: string;
    amount: number;
    result_code: number;
    timestamp: string;
  }): string {
    const secret = this.getSecret();
    if (!secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET chưa cấu hình — không ký IPN.');
    }
    const canonical = [
      p.order_id,
      p.trans_id,
      String(Math.round(p.amount)),
      String(p.result_code),
      p.timestamp,
    ].join('|');
    return createHmac('sha256', secret).update(canonical).digest('hex');
  }

  verifyIpnSignature(payload: {
    order_id: string;
    trans_id: string;
    amount: number;
    result_code: number;
    timestamp: string;
    signature: string;
  }): boolean {
    const secret = this.getSecret();
    if (!secret) return false;
    const expected = this.signIpnPayload({
      order_id: payload.order_id,
      trans_id: payload.trans_id,
      amount: payload.amount,
      result_code: payload.result_code,
      timestamp: payload.timestamp,
    });
    return this.safeEqualHex(expected, payload.signature);
  }

  generateTransactionId(): string {
    return `demo-${randomBytes(12).toString('hex')}`;
  }

  isoTimestamp(): string {
    return new Date().toISOString();
  }

  private safeEqualHex(a: string, b: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }
}
