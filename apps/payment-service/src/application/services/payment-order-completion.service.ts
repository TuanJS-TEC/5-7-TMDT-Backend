import { Injectable, Logger } from '@nestjs/common';
import { PaymentWriteRepository } from '../../infrastructure/persistence/write/payment.write.repository';
import {
  PaymentEventPublisher,
  type ListingPackagePaidPayload,
} from '../../infrastructure/messaging/payment-event.publisher';

@Injectable()
export class PaymentOrderCompletionService {
  private readonly logger = new Logger(PaymentOrderCompletionService.name);

  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly publisher: PaymentEventPublisher,
  ) {}

  /**
   * UC28 bước 7–8 / UC31 — hoàn tất đơn, publish event sang listing-service.
   */
  async completeAfterPayment(
    orderId: string,
    transactionId: string,
    source: ListingPackagePaidPayload['source'],
  ): Promise<boolean> {
    const order = await this.writeRepo.findById(orderId);
    if (!order) {
      return false;
    }
    if (order.status === 'success') {
      return false;
    }
    if (order.status !== 'pending' && order.status !== 'processing') {
      return false;
    }

    const now = new Date();
    await this.writeRepo.update(orderId, {
      status: 'success',
      transactionId,
      updatedAt: now,
      errorMessage: undefined,
    });

    const payload: ListingPackagePaidPayload = {
      orderId,
      userId: order.userId,
      listingId: order.listingId ?? null,
      listingPackageType: order.listingPackageType,
      transactionId,
      paidAt: now.toISOString(),
      source,
    };
    await this.publisher.publishListingPackagePaid(payload);

    this.logger.log(
      `Order ${orderId} completed (${source}) tx=${transactionId} → listing_package.paid`,
    );
    return true;
  }
}
