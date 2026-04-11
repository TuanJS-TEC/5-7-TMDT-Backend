import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel as AmqpChannel, ChannelModel } from 'amqplib';
import {
  PAYMENT_EVENTS,
  type RefundCompletedPayload,
} from '@car-marketplace/messaging';

export type ListingPackagePaidPayload = {
  orderId: string;
  userId: string;
  listingId: string | null;
  listingPackageType: string;
  transactionId: string;
  paidAt: string;
  source:
    | 'webhook'
    | 'reconcile'
    | 'e_wallet_webhook'
    | 'e_wallet_reconcile'
    | 'atm_webhook'
    | 'uc31_gateway_webhook';
};

export type { RefundCompletedPayload };

@Injectable()
export class PaymentEventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(PaymentEventPublisher.name);
  private broker: ChannelModel | null = null;
  private channel: AmqpChannel | null = null;

  constructor(private readonly config: ConfigService) {}

  private async ensureChannel(): Promise<AmqpChannel | null> {
    const url = this.config.get<string>('RABBITMQ_URL')?.trim();
    if (!url) {
      return null;
    }
    if (this.channel) {
      return this.channel;
    }
    this.broker = await connect(url);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(PAYMENT_EVENTS.LISTING_PACKAGE_PAID, {
      durable: true,
    });
    await this.channel.assertQueue(PAYMENT_EVENTS.REFUND_COMPLETED, {
      durable: true,
    });
    await this.channel.assertQueue(PAYMENT_EVENTS.REFUND_COMPLETED_LISTING, {
      durable: true,
    });
    return this.channel;
  }

  async publishListingPackagePaid(
    payload: ListingPackagePaidPayload,
  ): Promise<void> {
    const ch = await this.ensureChannel();
    if (!ch) {
      this.logger.debug(
        `[RabbitMQ off] LISTING_PACKAGE_PAID ${JSON.stringify(payload)}`,
      );
      return;
    }
    ch.sendToQueue(
      PAYMENT_EVENTS.LISTING_PACKAGE_PAID,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
    this.logger.log(
      `Published ${PAYMENT_EVENTS.LISTING_PACKAGE_PAID} order=${payload.orderId}`,
    );
  }

  async publishRefundCompleted(payload: RefundCompletedPayload): Promise<void> {
    const ch = await this.ensureChannel();
    if (!ch) {
      this.logger.debug(
        `[RabbitMQ off] REFUND_COMPLETED ${JSON.stringify(payload)}`,
      );
      return;
    }
    const json = JSON.stringify(payload);
    ch.sendToQueue(PAYMENT_EVENTS.REFUND_COMPLETED, Buffer.from(json), {
      persistent: true,
    });
    ch.sendToQueue(
      PAYMENT_EVENTS.REFUND_COMPLETED_LISTING,
      Buffer.from(json),
      { persistent: true },
    );
    this.logger.log(
      `Published ${PAYMENT_EVENTS.REFUND_COMPLETED} + ${PAYMENT_EVENTS.REFUND_COMPLETED_LISTING} refund=${payload.refundId} order=${payload.orderId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.broker?.close();
    } catch {
      /* ignore */
    }
  }
}
