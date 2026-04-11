import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel as AmqpChannel, ChannelModel } from 'amqplib';
import type { RefundCompletedPayload } from '@car-marketplace/messaging';
import { PAYMENT_EVENTS } from '@car-marketplace/messaging';
import type { ListingPackageType } from '../../domain/entities/listing.entity';
import { ListingWriteRepository } from '../persistence/write/listing.write.repository';

/**
 * UC34 phụ — sau hoàn tiền gói tin: thu hồi gói đã áp trên tin (về `basic`).
 */
@Injectable()
export class PaymentRefundCompletedConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentRefundCompletedConsumer.name);
  private broker: ChannelModel | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly listingWrite: ListingWriteRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'RABBITMQ_URL chưa cấu hình — bỏ qua consumer payment.refund.completed (thu hồi gói tin).',
      );
      return;
    }

    this.broker = await connect(url);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(PAYMENT_EVENTS.REFUND_COMPLETED_LISTING, {
      durable: true,
    });

    await this.channel.consume(
      PAYMENT_EVENTS.REFUND_COMPLETED_LISTING,
      async (msg) => {
        if (!msg || !this.channel) {
          return;
        }
        try {
          const body = JSON.parse(
            msg.content.toString(),
          ) as RefundCompletedPayload;

          if (body.listingId) {
            const listing = await this.listingWrite.findById(body.listingId);
            if (listing && listing.sellerId === body.userId) {
              await this.listingWrite.update(body.listingId, {
                packageType: 'basic' as ListingPackageType,
              });
              this.logger.log(
                `UC34 — Đã thu hồi gói (${body.listingPackageType} → basic) cho tin ${body.listingId} sau hoàn tiền (order ${body.orderId}).`,
              );
            } else {
              this.logger.warn(
                `Bỏ qua thu hồi gói: tin ${body.listingId} không tồn tại hoặc không thuộc seller.`,
              );
            }
          } else {
            this.logger.debug(
              `Order ${body.orderId} không gắn listingId — không cập nhật tin.`,
            );
          }

          this.channel.ack(msg);
        } catch (e) {
          this.logger.error(e);
          this.channel.nack(msg, false, true);
        }
      },
    );

    this.logger.log(
      `Đang lắng nghe queue ${PAYMENT_EVENTS.REFUND_COMPLETED_LISTING} (thu hồi gói tin).`,
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
