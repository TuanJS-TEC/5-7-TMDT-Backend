import { Injectable, Logger } from '@nestjs/common';
import type { SmsGateway } from './sms-gateway.interface';

@Injectable()
export class MockSmsGateway implements SmsGateway {
  private readonly logger = new Logger(MockSmsGateway.name);

  async sendOtp(phoneE164Digits: string, message: string): Promise<boolean> {
    this.logger.log(`[SMS mock] → ${phoneE164Digits}: ${message}`);
    return true;
  }
}
