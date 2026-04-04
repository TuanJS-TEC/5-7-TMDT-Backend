import { Injectable, Logger } from '@nestjs/common';

/**
 * Gửi SMS khi tài khoản bị khóa đăng nhập tạm (UC13 A1).
 * Stub: tích hợp thật qua notification-service / nhà cung cấp SMS.
 */
@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);

  async sendLoginTempLockNotice(phone: string): Promise<void> {
    this.logger.warn(
      `[SMS stub] Thông báo khóa đăng nhập tạm 15 phút gửi tới ${phone}`,
    );
  }

  /**
   * UC12 bước 3 — SMS Gateway (stub).
   * A3: set SMS_SIMULATE_FAILURE=true để mô phỏng lỗi gửi SMS.
   */
  async sendOtp(
    phone: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    if (process.env.SMS_SIMULATE_FAILURE === 'true') {
      this.logger.error(`[SMS stub] Giả lập lỗi gửi SMS cho ${phone}`);
      throw new Error('SMS_GATEWAY_FAILURE');
    }
    this.logger.warn(
      `[SMS stub] OTP purpose=${purpose} → ${phone}: ${code} (chỉ log dev)`,
    );
  }
}
