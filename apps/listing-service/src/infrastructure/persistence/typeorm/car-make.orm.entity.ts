import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'car_makes' })
@Index(['slug'], { unique: true })
export class CarMakeOrmEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  showOnHome!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
