export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sold';

export class Listing {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public priceVnd: number,
    public sellerId: string,
    public status: ListingStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  approve(): void {
    this.status = 'approved';
    this.updatedAt = new Date();
  }

  markSold(): void {
    this.status = 'sold';
    this.updatedAt = new Date();
  }
}
