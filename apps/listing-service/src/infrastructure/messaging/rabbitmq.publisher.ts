import { Injectable, Logger } from '@nestjs/common';

/** Stub publisher — wire to amqplib / Nest microservices in production */
@Injectable()
export class RabbitMqPublisher {
  private readonly logger = new Logger(RabbitMqPublisher.name);

  async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`[RabbitMQ stub] ${routingKey} ${JSON.stringify(payload)}`);
  }
}
