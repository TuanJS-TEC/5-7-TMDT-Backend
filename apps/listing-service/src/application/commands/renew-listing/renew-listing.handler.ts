import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RenewListingCommand } from './renew-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PaymentServiceHttpClient } from '../../../infrastructure/payment/payment-service-http.client';
import { ListingRenewedEvent } from '../../events/listing-renewed/listing-renewed.event';

@CommandHandler(RenewListingCommand)
export class RenewListingHandler implements ICommandHandler<RenewListingCommand> {
  constructor(
    private readonly listingWriteRepository: ListingWriteRepository,
    private readonly paymentService: PaymentServiceHttpClient,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RenewListingCommand): Promise<void> {
    const listing = await this.listingWriteRepository.findById(command.listingId);

    if (!listing) {
      throw new NotFoundException('Tin đăng không tồn tại.');
    }
    if (listing.sellerId !== command.sellerId) {
      throw new ForbiddenException('Bạn không có quyền gia hạn tin đăng này.');
    }
    // Trong thực tế, cần kiểm tra trạng thái của paymentOrderId từ Payment Service
    const paymentStatus = await this.paymentService.getPaymentOrderStatus(command.paymentOrderId, command.sellerId);

    if (paymentStatus.status !== 'success') {
      throw new BadRequestException('Thanh toán đơn hàng gia hạn chưa thành công.');
    }

    // Tính toán ngày hết hạn (giả định 30 ngày cho mỗi gói)
    const durationDays = 30; // Cần lấy từ data gói thật
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);

    await this.listingWriteRepository.update(command.listingId, {
      expiresAt: newExpiresAt,
      packageType: command.newPackageType,
      status: 'approved',
    });

    this.eventBus.publish(new ListingRenewedEvent(command.listingId, listing.sellerId, command.newPackageType, newExpiresAt));
  }
}