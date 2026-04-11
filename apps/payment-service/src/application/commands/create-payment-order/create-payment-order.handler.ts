import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePaymentOrderCommand } from './create-payment-order.command';
import { PaymentWriteRepository } from '../../../infrastructure/persistence/write/payment.write.repository';
import { PaymentOrder } from '../../../domain/entities/payment-order.entity';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreatePaymentOrderCommand)
export class CreatePaymentOrderHandler
  implements ICommandHandler<CreatePaymentOrderCommand>
{
  constructor(private readonly paymentWriteRepo: PaymentWriteRepository) {}

  async execute(command: CreatePaymentOrderCommand): Promise<string> {
    const orderId = uuidv4();
    const order = new PaymentOrder(
      orderId,
      command.userId,
      command.listingPackageType,
      command.listingId,
      command.paymentMethod,
      command.amountVnd,
      'pending',
      new Date(),
      new Date(),
    );

    await this.paymentWriteRepo.create({
      id: order.id,
      userId: order.userId,
      listingPackageType: order.listingPackageType,
      listingId: order.listingId ?? undefined,
      paymentMethod: order.paymentMethod,
      amountVnd: order.amountVnd,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });

    // Event có thể được publish ở đây nếu cần integration (PaymentOrderCreatedEvent)
    
    return orderId;
  }
}
