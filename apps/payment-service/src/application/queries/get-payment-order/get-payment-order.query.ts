export class GetPaymentOrderQuery {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
