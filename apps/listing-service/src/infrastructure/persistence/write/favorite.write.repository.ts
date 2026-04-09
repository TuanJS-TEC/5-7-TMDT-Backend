import { Inject, Injectable } from '@nestjs/common';
import { FAVORITE_STORE } from '../listing.store.token';

@Injectable()
export class FavoriteWriteRepository {
  constructor(
    @Inject(FAVORITE_STORE)
    private readonly store: Map<string, Set<string>>,
  ) {}

  async addFavorite(userId: string, listingId: string): Promise<void> {
    if (!this.store.has(userId)) {
      this.store.set(userId, new Set<string>());
    }
    this.store.get(userId)!.add(listingId);
  }

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    if (this.store.has(userId)) {
      this.store.get(userId)!.delete(listingId);
    }
  }
}
