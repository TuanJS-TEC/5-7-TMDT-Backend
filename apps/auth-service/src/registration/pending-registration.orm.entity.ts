import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

/** UC11: dữ liệu đăng ký tạm — OTP do UC12 `otp_challenges` (purpose registration) quản lý */
@Entity({ name: 'pending_registrations' })
export class PendingRegistrationOrmEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({ type: 'varchar', length: 200 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 32 })
  accountType!: string;

  @Column({ type: 'timestamptz' })
  pendingExpiresAt!: Date;
}
