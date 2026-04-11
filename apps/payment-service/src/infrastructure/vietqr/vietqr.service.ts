import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * VietQR quicklink: PNG qua CDN api.vietqr.io
 * @see https://www.vietqr.io/
 */
@Injectable()
export class VietQrService {
  constructor(private readonly config: ConfigService) {}

  get bankName(): string {
    return this.config.get<string>('VIETQR_BANK_NAME', 'Ngân hàng nhận (cấu hình)');
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
    const canonical = [
      payload.order_id,
      payload.transaction_id,
      String(payload.amount),
      payload.status,
      payload.timestamp,
    ].join('|');
    const expected = createHmac('sha256', secret).update(canonical).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(payload.signature, 'hex'));
    } catch {
      return false;
    }
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
