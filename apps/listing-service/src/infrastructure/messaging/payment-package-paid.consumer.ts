import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import type { Channel as AmqpChannel, ChannelModel } from 'amqplib';
import { PAYMENT_EVENTS } from '@car-marketplace/messaging';
import type { ListingPackageType } from '../../domain/entities/listing.entity';
import { ListingWriteRepository } from '../persistence/write/listing.write.repository';

type ListingPackagePaidMessage = {
  orderId: string;
  userId: string;
  listingId: string | null;
  listingPackageType: string;
  transactionId: string;
  paidAt: string;
  source: string;
};

/**
 * Nhận queue `payment.listing_package.paid` từ payment-service — áp gói lên tin đăng.
 */
@Injectable()
export class PaymentPackagePaidConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PaymentPackagePaidConsumer.name);
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
        'RABBITMQ_URL chưa cấu hình — bỏ qua consumer thanh toán (payment.listing_package.paid).',
      );
      return;
    }

    this.broker = await connect(url);
    this.channel = await this.broker.createChannel();
    await this.channel.assertQueue(PAYMENT_EVENTS.LISTING_PACKAGE_PAID, {
      durable: true,
    });

    await this.channel.consume(
      PAYMENT_EVENTS.LISTING_PACKAGE_PAID,
      async (msg) => {
        if (!msg || !this.channel) {
          return;
        }
        try {
          const body = JSON.parse(
            msg.content.toString(),
          ) as ListingPackagePaidMessage;

          if (body.listingId) {
            const listing = await this.listingWrite.findById(body.listingId);
            if (listing && listing.sellerId === body.userId) {
              await this.listingWrite.update(body.listingId, {
                packageType: body.listingPackageType as ListingPackageType,
              });
              this.logger.log(
                `UC28 — Đã áp gói ${body.listingPackageType} cho tin ${body.listingId} (order ${body.orderId}).`,
              );
            } else {
              this.logger.warn(
                `Bỏ qua kích hoạt gói: tin ${body.listingId} không tồn tại hoặc không thuộc seller.`,
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
      `Đang lắng nghe queue ${PAYMENT_EVENTS.LISTING_PACKAGE_PAID}`,
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
