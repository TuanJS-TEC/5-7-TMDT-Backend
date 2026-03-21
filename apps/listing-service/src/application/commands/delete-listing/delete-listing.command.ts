export class DeleteListingCommand {
  constructor(
    public readonly id: string,
    public readonly sellerId: string,
  ) {}
}
