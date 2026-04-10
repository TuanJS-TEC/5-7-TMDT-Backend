import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPaymentMethodsQuery } from './get-payment-methods.query';
import { PAYMENT_METHODS } from '../../../domain/value-objects/payment-method.value-object';

@QueryHandler(GetPaymentMethodsQuery)
export class GetPaymentMethodsHandler implements IQueryHandler<GetPaymentMethodsQuery> {
  async execute(query: GetPaymentMethodsQuery) {
    return PAYMENT_METHODS;
  }
}
