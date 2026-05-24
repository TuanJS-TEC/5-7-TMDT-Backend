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
  LISTING_EVENTS,
  type ListingSoldPayload,
} from '@car-marketplace/messaging';
import { ListingSoldNotificationDispatcher } from '../../application/listing-sold-notification.dispatcher';

async function connectAmqpWithRetry(
  url: string,
  logger: Logger,
  maxAttempts = 15,
  delayMs = 2000,
): Promise<ChannelModel> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await connect(url);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn(`AMQP connect attempt ${attempt}/${maxAttempts} failed: ${msg}`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

/** UC25 — subscribe `listing.sold` */
@Injectable()
export class ListingSoldConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ListingSoldConsumer.name);
  private broker: ChannelModel | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly listingSoldNotifications: ListingSoldNotificationDispatcher,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'RABBITMQ_URL chưa cấu hình — bỏ qua consumer listing.sold (UC25).',
      );
      return;
    }

    this.broker = await connectAmqpWithRetry(url, this.logger);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(LISTING_EVENTS.SOLD, { durable: true });

    await this.channel.consume(LISTING_EVENTS.SOLD, async (msg) => {
      if (!msg || !this.channel) {
        return;
      }
      try {
        const body = JSON.parse(msg.content.toString()) as ListingSoldPayload;
        await this.listingSoldNotifications.dispatchListingSold(body);
        this.channel.ack(msg);
      } catch (e) {
        this.logger.error(e);
        this.channel.nack(msg, false, true);
      }
    });

    this.logger.log(`Đang lắng nghe queue ${LISTING_EVENTS.SOLD} (UC25).`);
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
