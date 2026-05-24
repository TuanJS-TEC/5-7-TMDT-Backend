export class GetMyListingsQuery {
  constructor(
    public readonly sellerId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
