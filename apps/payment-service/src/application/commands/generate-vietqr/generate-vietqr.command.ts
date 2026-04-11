export class GenerateVietQrCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
