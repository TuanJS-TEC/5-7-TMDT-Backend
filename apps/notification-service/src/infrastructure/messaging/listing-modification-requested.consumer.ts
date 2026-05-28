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
  type ListingModificationRequestedPayload,
} from '@car-marketplace/messaging';
import { ListingModificationRequestedDispatcher } from '../../application/listing-modification-requested.dispatcher';

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

/** UC33 — subscribe `listing.modification_requested` */
@Injectable()
export class ListingModificationRequestedConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ListingModificationRequestedConsumer.name);
  private broker: ChannelModel | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly dispatcher: ListingModificationRequestedDispatcher,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'RABBITMQ_URL chưa cấu hình — bỏ qua consumer listing.modification_requested (UC33).',
      );
      return;
    }

    this.broker = await connectAmqpWithRetry(url, this.logger);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(LISTING_EVENTS.MODIFICATION_REQUESTED, {
      durable: true,
    });

    await this.channel.consume(
      LISTING_EVENTS.MODIFICATION_REQUESTED,
      async (msg) => {
        if (!msg || !this.channel) {
          return;
        }
        try {
          const body = JSON.parse(
            msg.content.toString(),
          ) as ListingModificationRequestedPayload;
          await this.dispatcher.dispatchFromEvent(body);
          this.channel.ack(msg);
        } catch (e) {
          this.logger.error(e);
          this.channel.nack(msg, false, true);
        }
      },
    );

    this.logger.log(
      `Đang lắng nghe queue ${LISTING_EVENTS.MODIFICATION_REQUESTED} (UC33).`,
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
