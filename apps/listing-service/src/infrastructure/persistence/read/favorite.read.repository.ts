import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteOrmEntity } from '../typeorm/favorite.orm.entity';

@Injectable()
export class FavoriteReadRepository {
  constructor(
    @InjectRepository(FavoriteOrmEntity)
    private readonly repo: Repository<FavoriteOrmEntity>,
  ) {}

  async getFavoriteIds(userId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { userId } });
    return rows.map((row) => row.listingId);
  }
}
