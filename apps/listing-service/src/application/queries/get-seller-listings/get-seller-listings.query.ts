export class GetSellerListingsQuery {
  constructor(
    public readonly sellerId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
