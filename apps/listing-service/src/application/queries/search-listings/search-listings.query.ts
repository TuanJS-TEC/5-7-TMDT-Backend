export class SearchListingsQuery {
  constructor(
    public readonly keyword: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly sortBy?: string,
    public readonly sortOrder?: 'asc' | 'desc',
  ) {}
}