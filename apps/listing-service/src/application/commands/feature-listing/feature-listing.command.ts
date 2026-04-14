export class FeatureListingCommand {
  constructor(
    public readonly listingId: string,
    public readonly days: number,
  ) {}
}
