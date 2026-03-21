import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Column({ unique: true, length: 20 })
  phone!: string;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;
}
