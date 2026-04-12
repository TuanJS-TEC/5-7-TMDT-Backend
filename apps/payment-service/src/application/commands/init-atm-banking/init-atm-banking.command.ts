export class InitAtmBankingCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
