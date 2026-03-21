export class CreateListingCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly priceVnd: number,
    public readonly sellerId: string,
  ) {}
}
