import { Inject, Injectable } from '@nestjs/common';
import { FAVORITE_STORE } from '../listing.store.token';

@Injectable()
export class FavoriteReadRepository {
  constructor(
    @Inject(FAVORITE_STORE)
    private readonly store: Map<string, Set<string>>,
  ) {}

  async getFavoriteIds(userId: string): Promise<string[]> {
    const favorites = this.store.get(userId);
    if (!favorites) return [];
    return Array.from(favorites);
  }
}
