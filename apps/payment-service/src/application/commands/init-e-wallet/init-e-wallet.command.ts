export class InitEWalletCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
