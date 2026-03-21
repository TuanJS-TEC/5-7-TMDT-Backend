export class GetListingListQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly status?: string,
  ) {}
}
