export const SMS_GATEWAY = Symbol('SMS_GATEWAY');

export interface SmsGateway {
  /** Trả về false nếu gateway lỗi (A3) */
  sendOtp(phoneE164Digits: string, message: string): Promise<boolean>;
}
