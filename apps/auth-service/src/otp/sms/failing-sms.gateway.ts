import { Injectable } from '@nestjs/common';
import type { SmsGateway } from './sms-gateway.interface';

/** Dùng khi cần test luồng A3 (luôn trả lỗi gửi SMS) */
@Injectable()
export class FailingSmsGateway implements SmsGateway {
  async sendOtp(): Promise<boolean> {
    return false;
  }
}
