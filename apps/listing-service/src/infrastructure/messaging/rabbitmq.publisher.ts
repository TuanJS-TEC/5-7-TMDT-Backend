import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel as AmqpChannel, ChannelModel } from 'amqplib';
import { LISTING_EVENTS } from '@car-marketplace/messaging';

@Injectable()
export class RabbitMqPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisher.name);
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
    const queues = Object.values(LISTING_EVENTS);
    for (const q of queues) {
      await this.channel.assertQueue(q, { durable: true });
    }
    return this.channel;
  }

  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    const ch = await this.ensureChannel();
    if (!ch) {
      this.logger.debug(`[RabbitMQ off] ${routingKey} ${JSON.stringify(payload)}`);
      return;
    }
    ch.sendToQueue(routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
    this.logger.log(`Published ${routingKey}`);
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
