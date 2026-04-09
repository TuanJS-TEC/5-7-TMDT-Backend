export class RemoveFavoriteCommand {
  constructor(public readonly userId: string, public readonly listingId: string) {}
}
