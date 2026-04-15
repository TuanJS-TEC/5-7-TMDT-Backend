export class MarkListingSoldCommand {
  constructor(
    public readonly listingId: string,
    public readonly sellerId: string, // Xác thực người bán
  ) {}
}