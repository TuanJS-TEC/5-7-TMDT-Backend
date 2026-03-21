import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'listings' })
export class ListingOrmEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Giá VND — dùng bigint an toàn cho số lớn */
  @Column({ type: 'bigint' })
  priceVnd!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;
}
