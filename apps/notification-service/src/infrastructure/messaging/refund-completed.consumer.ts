import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel as AmqpChannel, ChannelModel } from 'amqplib';
import {
  PAYMENT_EVENTS,
  type RefundCompletedPayload,
} from '@car-marketplace/messaging';
import { RefundNotificationDispatcher } from '../../application/refund-notification.dispatcher';

/**
 * UC60 — subscribe `payment.refund.completed` (UC34 hoàn tiền → thông báo người dùng).
 */
@Injectable()
export class RefundCompletedConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RefundCompletedConsumer.name);
  private broker: ChannelModel | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly refundNotifications: RefundNotificationDispatcher,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'RABBITMQ_URL chưa cấu hình — bỏ qua consumer payment.refund.completed (UC60).',
      );
      return;
    }

    this.broker = await connect(url);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(PAYMENT_EVENTS.REFUND_COMPLETED, {
      durable: true,
    });

    await this.channel.consume(
      PAYMENT_EVENTS.REFUND_COMPLETED,
      async (msg) => {
        if (!msg || !this.channel) {
          return;
        }
        try {
          const body = JSON.parse(
            msg.content.toString(),
          ) as RefundCompletedPayload;

          await this.refundNotifications.dispatchRefundCompleted(body);
          this.channel.ack(msg);
        } catch (e) {
          this.logger.error(e);
          this.channel.nack(msg, false, true);
        }
      },
    );

    this.logger.log(
      `Đang lắng nghe queue ${PAYMENT_EVENTS.REFUND_COMPLETED} (UC60).`,
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
