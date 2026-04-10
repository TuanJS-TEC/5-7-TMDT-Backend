import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFavoriteListingsQuery } from './get-favorite-listings.query';
import { FavoriteReadRepository } from '../../../infrastructure/persistence/read/favorite.read.repository';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingResponseDto } from '../../../presentation/dto/listing.response.dto';

@QueryHandler(GetFavoriteListingsQuery)
export class GetFavoriteListingsHandler
  implements IQueryHandler<GetFavoriteListingsQuery, ListingResponseDto[]>
{
  constructor(
    private readonly favoriteReadRepo: FavoriteReadRepository,
    private readonly listingReadRepo: ListingReadRepository,
  ) {}

  async execute(query: GetFavoriteListingsQuery): Promise<ListingResponseDto[]> {
    const favoriteIds = await this.favoriteReadRepo.getFavoriteIds(query.userId);
    if (favoriteIds.length === 0) {
      return [];
    }
    return this.listingReadRepo.findByIds(favoriteIds);
  }
}
