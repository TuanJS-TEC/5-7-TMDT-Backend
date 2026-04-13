import type { PaymentOrderRecord } from './payment-order.record';
import type { PaymentOrderOrmEntity } from './typeorm/payment-order.orm.entity';

export function paymentOrderToRecord(e: PaymentOrderOrmEntity): PaymentOrderRecord {
  return {
    id: e.id,
    userId: e.userId,
    listingPackageType: e.listingPackageType,
    listingId: e.listingId ?? undefined,
    paymentMethod: e.paymentMethod as PaymentOrderRecord['paymentMethod'],
    amountVnd: e.amountVnd,
    status: e.status as PaymentOrderRecord['status'],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    transactionId: e.transactionId ?? undefined,
    errorMessage: e.errorMessage ?? undefined,
    vietQrImageUrl: e.vietQrImageUrl ?? undefined,
    vietQrGeneratedAt: e.vietQrGeneratedAt ?? undefined,
    vietQrExpiresAt: e.vietQrExpiresAt ?? undefined,
    transferContent: e.transferContent ?? undefined,
    walletPayUrl: e.walletPayUrl ?? undefined,
    walletSessionExpiresAt: e.walletSessionExpiresAt ?? undefined,
    atmPayUrl: e.atmPayUrl ?? undefined,
    atmSessionExpiresAt: e.atmSessionExpiresAt ?? undefined,
    refundedAt: e.refundedAt ?? undefined,
  };
}
