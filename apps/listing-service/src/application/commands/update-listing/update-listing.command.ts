export class UpdateListingCommand {
  constructor(
    public readonly id: string,
    public readonly sellerId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly priceVnd?: number,
  ) {}
}
