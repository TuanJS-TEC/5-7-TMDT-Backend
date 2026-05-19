import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'favorites' })
@Index('favorites_user_listing_unique', ['userId', 'listingId'], { unique: true })
export class FavoriteOrmEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  listingId!: string;
}
