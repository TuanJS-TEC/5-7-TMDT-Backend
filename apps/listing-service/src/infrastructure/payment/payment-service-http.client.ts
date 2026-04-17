import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentOrderStatusResponse {
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
}

@Injectable()
export class PaymentServiceHttpClient {
  private readonly logger = new Logger(PaymentServiceHttpClient.name);
  private readonly paymentServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.paymentServiceUrl =
      this.config.get<string>('PAYMENT_SERVICE_URL')?.trim() ?? 'http://localhost:3003'; // Cổng Payment Service
  }

  async getPaymentOrderStatus(
    orderId: string,
    userId: string, // Để Payment Service xác thực quyền truy cập order
  ): Promise<PaymentOrderStatusResponse> {
    const url = `${this.paymentServiceUrl.replace(/\/$/, '')}/v1/payments/orders/${orderId}`;
    const requestId = uuidv4();
    const mockJwtToken = 'mock-jwt-token-for-internal-call'; // Giả lập JWT token
    
    try {
      // Trong môi trường mock, chúng ta giả lập kết quả từ Payment Service
      if (orderId.includes('success')) {
        return { orderId, status: 'success' };
      }
      if (orderId.includes('failed')) {
        return { orderId, status: 'failed' };
      }
      if (orderId.includes('pending')) {
        return { orderId, status: 'pending' };
      }
      
      // Nếu muốn gọi Payment Service thật (khi có endpoint public hoặc internal API Key)
      // const { data } = await firstValueFrom(
      //   this.http.get<{ data: PaymentOrderStatusResponse }>(url, {
      //     headers: {
      //       'x-request-id': requestId,
      //       // 'Authorization': `Bearer ${mockJwtToken}`, // Nếu Payment Service yêu cầu JWT
      //       'x-user-id': userId // Hoặc truyền userId qua header
      //     },
      //     timeout: 10_000,
      //   }),
      // );
      // return data.data;

      throw new ServiceUnavailableException('Không tìm thấy trạng thái thanh toán đơn hàng này (mock)');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`UC24 — Gọi payment-service thất bại (${url}): ${msg}`);
      throw new ServiceUnavailableException({
        code: 'UC24_PAYMENT_SERVICE_UNAVAILABLE',
        message: 'Không kết nối được dịch vụ thanh toán. Vui lòng thử lại sau.',
      });
    }
  }
}