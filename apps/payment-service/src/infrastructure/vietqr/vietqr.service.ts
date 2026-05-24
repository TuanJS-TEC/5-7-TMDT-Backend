import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { VIETQR_DEMO_IMAGE_PATH } from './vietqr-assets';

/**
 * VietQR quicklink: PNG qua CDN api.vietqr.io (production) hoặc ảnh tĩnh demo (dev).
 * @see https://www.vietqr.io/
 */
@Injectable()
export class VietQrService {
  constructor(private readonly config: ConfigService) {}

  get bankName(): string {
    return this.config.get<string>('VIETQR_BANK_NAME', 'Ngân hàng nhận (cấu hình)');
  }

  /** Dev mặc định dùng ảnh tĩnh trong repo (docs/VietQR → public/assets). */
  useDemoImage(): boolean {
    return this.config.get<string>('VIETQR_USE_DEMO_IMAGE', 'true') !== 'false';
  }

  getDemoImageUrl(): string {
    return (
      this.config.get<string>('VIETQR_DEMO_IMAGE_URL')?.trim() ||
      VIETQR_DEMO_IMAGE_PATH
    );
  }

  /** URL tuyệt đối cho trang HTML sandbox (payment-service phục vụ /assets). */
  getDemoImageAbsoluteUrl(): string {
    const rel = this.getDemoImageUrl();
    if (rel.startsWith('http://') || rel.startsWith('https://')) {
      return rel;
    }
    const origin = (
      this.config.get<string>('PAYMENT_SERVICE_PUBLIC_ORIGIN')?.trim() ||
      'http://localhost:3004'
    ).replace(/\/$/, '');
    return `${origin}${rel.startsWith('/') ? rel : `/${rel}`}`;
  }

  /**
   * URL hiển thị mã QR — ưu tiên ảnh demo khi bật VIETQR_USE_DEMO_IMAGE.
   */
  resolveQrImageUrl(params: { orderId: string; amountVnd: number }): string {
    if (this.useDemoImage()) {
      return this.getDemoImageUrl();
    }
    return this.buildQuicklinkImageUrl(params);
  }

  isBankAccountConfigured(): boolean {
    return Boolean(
      this.config.get<string>('VIETQR_BANK_BIN')?.trim() &&
        this.config.get<string>('VIETQR_ACCOUNT_NO')?.trim() &&
        this.config.get<string>('VIETQR_ACCOUNT_NAME')?.trim(),
    );
  }

  buildQuicklinkImageUrl(params: {
    orderId: string;
    amountVnd: number;
  }): string {
    const bankBin = this.requireEnv('VIETQR_BANK_BIN');
    const accountNo = this.requireEnv('VIETQR_ACCOUNT_NO');
    const accountName = this.requireEnv('VIETQR_ACCOUNT_NAME');
    const templateId = this.config.get<string>('VIETQR_TEMPLATE_ID', 'compact2');
    const imageBase = this.config
      .get<string>('VIETQR_IMAGE_BASE', 'https://api.vietqr.io/image')
      .replace(/\/$/, '');

    const path = `${bankBin}-${accountNo}-${templateId}.jpg`;
    const base = `${imageBase}/${path}`;
    const qs = new URLSearchParams({
      accountName: this.normalizeAccountName(accountName),
      amount: String(Math.round(params.amountVnd)),
      addInfo: params.orderId,
    });
    return `${base}?${qs.toString()}`;
  }

  /**
   * UC31 — Xác thực HMAC-SHA256 hex trên chuỗi canonical:
   * order_id|transaction_id|amount|status|timestamp
   */
  buildWebhookCanonical(payload: {
    order_id: string;
    transaction_id: string;
    amount: number;
    status: string;
    timestamp: string;
  }): string {
    return [
      payload.order_id,
      payload.transaction_id,
      String(payload.amount),
      payload.status,
      payload.timestamp,
    ].join('|');
  }

  signWebhookPayload(payload: {
    order_id: string;
    transaction_id: string;
    amount: number;
    status: string;
    timestamp: string;
  }): string {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET chưa cấu hình');
    }
    return createHmac('sha256', secret)
      .update(this.buildWebhookCanonical(payload))
      .digest('hex');
  }

  verifyWebhookSignature(payload: {
    order_id: string;
    transaction_id: string;
    amount: number;
    status: string;
    timestamp: string;
    signature: string;
  }): boolean {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) {
      return false;
    }
    const expected = createHmac('sha256', secret)
      .update(this.buildWebhookCanonical(payload))
      .digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(payload.signature, 'hex'));
    } catch {
      return false;
    }
  }

  isDemoModeEnabled(): boolean {
    return this.config.get<string>('PAYMENT_DEMO_MODE', 'true') === 'true';
  }

  private requireEnv(key: string): string {
    const v = this.config.get<string>(key);
    if (!v?.trim()) {
      throw new Error(`Missing required env: ${key}`);
    }
    return v.trim();
  }

  /** VietQR yêu cầu không dấu; chuẩn hóa khoảng trắng */
  private normalizeAccountName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
}
