export class GetAdminSoldListingsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
