import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** UC30 A3 — timeout demo (phút) */
const ATM_SESSION_MS = 20 * 60 * 1000;

/**
 * UC30 — Cổng ATM / Internet Banking dạng demo (VNPay/PayOS-style, không gọi API thật).
 */
@Injectable()
export class DemoAtmGatewayService {
  constructor(private readonly config: ConfigService) {}

  get sessionTtlMs(): number {
    return ATM_SESSION_MS;
  }

  hasWebhookSecret(): boolean {
    return !!this.getSecret();
  }

  private getSecret(): string {
    return (
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET')?.trim() ||
      this.config.get<string>('DEMO_ATM_GATEWAY_SECRET')?.trim() ||
      ''
    );
  }

  getPublicApiBase(): string {
    const raw =
      this.config.get<string>('PAYMENT_PUBLIC_BASE_URL')?.trim() ||
      'http://localhost:3004/api/v1';
    return raw.replace(/\/$/, '');
  }

  isAtmInternetBankingMethod(paymentMethod: string): boolean {
    return paymentMethod === 'atm_internet_banking';
  }

  buildPayPageUrl(orderId: string, expiresAt: Date): { url: string; exp: number; sig: string } {
    const secret = this.getSecret();
    if (!secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET (hoặc DEMO_ATM_GATEWAY_SECRET) chưa cấu hình.');
    }
    const exp = expiresAt.getTime();
    const sig = this.signPayPage(orderId, exp, secret);
    const base = this.getPublicApiBase();
    const url = `${base}/payments/demo-atm/pay?orderId=${encodeURIComponent(orderId)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
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
    return createHmac('sha256', secret).update(`${orderId}|${exp}`).digest('hex');
  }

  /**
   * UC31 — IPN: order_id|transaction_no|amount|response_code|bank_code|timestamp → secure_hash (hex)
   */
  signIpnPayload(p: {
    order_id: string;
    transaction_no: string;
    amount: number;
    response_code: string;
    bank_code: string;
    timestamp: string;
  }): string {
    const secret = this.getSecret();
    if (!secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET chưa cấu hình.');
    }
    const canonical = [
      p.order_id,
      p.transaction_no,
      String(Math.round(p.amount)),
      p.response_code,
      p.bank_code,
      p.timestamp,
    ].join('|');
    return createHmac('sha256', secret).update(canonical).digest('hex');
  }

  verifyIpnSignature(payload: {
    order_id: string;
    transaction_no: string;
    amount: number;
    response_code: string;
    bank_code: string;
    timestamp: string;
    secure_hash: string;
  }): boolean {
    const secret = this.getSecret();
    if (!secret) return false;
    const expected = this.signIpnPayload({
      order_id: payload.order_id,
      transaction_no: payload.transaction_no,
      amount: payload.amount,
      response_code: payload.response_code,
      bank_code: payload.bank_code,
      timestamp: payload.timestamp,
    });
    return this.safeEqualHex(expected, payload.secure_hash);
  }

  generateTransactionNo(): string {
    return `ATM${randomBytes(8).toString('hex').toUpperCase()}`;
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
