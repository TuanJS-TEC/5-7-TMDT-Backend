import type { PaymentOrderStatus } from '../../domain/entities/payment-order.entity';
import type { PaymentMethodType } from '../../domain/value-objects/payment-method.value-object';

export interface PaymentOrderRecord {
  id: string;
  userId: string;
  listingPackageType: string;
  /** Áp dụng gói lên tin này khi thanh toán thành công */
  listingId?: string | null;
  paymentMethod: PaymentMethodType;
  amountVnd: number;
  status: PaymentOrderStatus;
  createdAt: Date;
  updatedAt: Date;
  transactionId?: string;
  errorMessage?: string;
  /** UC28 — URL ảnh QR (api.vietqr.io/...) */
  vietQrImageUrl?: string;
  vietQrGeneratedAt?: Date;
  /** Hết hạn hiển thị QR (5 phút từ lần tạo/gỡ) */
  vietQrExpiresAt?: Date;
  /** Nội dung CK (addInfo), thường là order_id */
  transferContent?: string;
  /** UC29 */
  walletPayUrl?: string;
  walletSessionExpiresAt?: Date;
  /** UC30 */
  atmPayUrl?: string;
  atmSessionExpiresAt?: Date;
  /** UC34 */
  refundedAt?: Date;
}
