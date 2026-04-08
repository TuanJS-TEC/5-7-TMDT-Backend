import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PaymentController } from './presentation/controllers/payment.controller';
import { GetPaymentMethodsHandler } from './application/queries/get-payment-methods/get-payment-methods.handler';
import { CreatePaymentOrderHandler } from './application/commands/create-payment-order/create-payment-order.handler';
import { PaymentReadRepository } from './infrastructure/persistence/read/payment.read.repository';
import { PaymentWriteRepository } from './infrastructure/persistence/write/payment.write.repository';
import { PAYMENT_STORE } from './infrastructure/persistence/payment.store.token';
import { PaymentOrderRecord } from './infrastructure/persistence/payment-order.record';

const queryHandlers = [GetPaymentMethodsHandler];
const commandHandlers = [CreatePaymentOrderHandler];
const repositories = [PaymentReadRepository, PaymentWriteRepository];

@Module({
  imports: [CqrsModule],
  controllers: [PaymentController],
  providers: [
    {
      provide: PAYMENT_STORE,
      useValue: new Map<string, PaymentOrderRecord>(),
    },
    ...queryHandlers,
    ...commandHandlers,
    ...repositories,
  ],
})
export class PaymentModule {}
