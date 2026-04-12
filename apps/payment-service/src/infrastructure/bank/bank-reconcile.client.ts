import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** Phản hồi API đối soát (tùy chỉnh theo ngân hàng / VietQR partner) */
export type ReconcileHttpResponse = {
  status: 'success' | 'pending' | 'not_found';
  transactionId?: string;
};

@Injectable()
export class BankReconcileClient {
  private readonly logger = new Logger(BankReconcileClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * UC28 A4 — GET URL mẫu: .../reconcile?orderId={orderId}&amount={amount}
   * Cấu hình PAYMENT_RECONCILE_HTTP_URL với placeholder {orderId} và {amount}
   */
  async checkOrder(
    orderId: string,
    amountVnd: number,
  ): Promise<ReconcileHttpResponse> {
    const urlTemplate = this.config.get<string>('PAYMENT_RECONCILE_HTTP_URL')?.trim();
    if (!urlTemplate) {
      this.logger.verbose(
        'PAYMENT_RECONCILE_HTTP_URL chưa cấu hình — bỏ qua đối soát HTTP.',
      );
      return { status: 'pending' };
    }

    const url = urlTemplate
      .replace('{orderId}', encodeURIComponent(orderId))
      .replace('{amount}', String(Math.round(amountVnd)));

    try {
      const { data } = await firstValueFrom(
        this.http.get<ReconcileHttpResponse>(url, {
          timeout: 15_000,
          validateStatus: () => true,
        }),
      );
      if (
        data?.status === 'success' &&
        data.transactionId &&
        typeof data.transactionId === 'string'
      ) {
        return { status: 'success', transactionId: data.transactionId };
      }
      if (data?.status === 'pending') {
        return { status: 'pending' };
      }
      return { status: 'not_found' };
    } catch (e) {
      this.logger.warn(`Reconcile HTTP failed for order ${orderId}: ${e}`);
      return { status: 'pending' };
    }
  }
}
