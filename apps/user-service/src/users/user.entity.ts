import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';
import { AccountType } from './account-type.enum';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Column({ length: 120 })
  fullName!: string;

  @Column({ unique: true, length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20 })
  accountType!: AccountType;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;

  /** Lượt đăng tin FREE (UC Opt: người bán +3 khi đăng ký) */
  @Column({ type: 'int', default: 0 })
  freePostCredits!: number;
}
