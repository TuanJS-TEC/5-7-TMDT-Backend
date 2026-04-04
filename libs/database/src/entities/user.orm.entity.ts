import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/** Vai trò đăng nhập — UC13 phân luồng User vs Admin */
export type UserRole = 'buyer' | 'seller' | 'admin';

/** UC11: Cá nhân (mua xe) vs Showroom (người bán) */
export type UserAccountType = 'personal' | 'showroom';

@Entity({ name: 'users' })
export class UserOrmEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  fullName!: string;

  @Column({ type: 'varchar', length: 32, default: 'personal' })
  accountType!: UserAccountType;

  /** UC11 bước 8 — chỉ cấp khi đăng ký showroom (seller) */
  @Column({ type: 'int', default: 0 })
  freeListingCredits!: number;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  phoneVerified!: boolean;

  /** Khóa bởi quản trị (A2) */
  @Column({ type: 'boolean', default: false })
  adminLocked!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adminLockReason?: string | null;

  /** Đếm sai mật khẩu liên tiếp (A1) */
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  /** Khóa đăng nhập tạm sau 5 lần sai (15 phút) */
  @Column({ type: 'timestamptz', nullable: true })
  loginLockedUntil?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  lastLoginUserAgent?: string | null;
}
