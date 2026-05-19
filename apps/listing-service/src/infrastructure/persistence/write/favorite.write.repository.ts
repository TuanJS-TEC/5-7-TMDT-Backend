import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteOrmEntity } from '../typeorm/favorite.orm.entity';

@Injectable()
export class FavoriteWriteRepository {
  constructor(
    @InjectRepository(FavoriteOrmEntity)
    private readonly repo: Repository<FavoriteOrmEntity>,
  ) {}

  async addFavorite(userId: string, listingId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, listingId } });
    if (existing) return;
    await this.repo.save(this.repo.create({ userId, listingId }));
  }

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    await this.repo.delete({ userId, listingId });
  }
}
