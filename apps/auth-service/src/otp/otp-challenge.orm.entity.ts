import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

/** UC12: mục đích OTP — đăng ký / đặt lại MK / xác thực SĐT */
export type OtpPurpose =
  | 'registration'
  | 'password_reset'
  | 'phone_verify'
  | 'phone_change';

@Entity({ name: 'otp_challenges' })
@Unique('uq_otp_phone_purpose', ['phone', 'purpose'])
export class OtpChallengeOrmEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({ type: 'varchar', length: 32 })
  purpose!: OtpPurpose;

  @Column({ type: 'varchar', length: 255 })
  otpHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /** Đếm sai OTP liên tiếp (reset khi gửi OTP mới) */
  @Column({ type: 'int', default: 0 })
  wrongAttempts!: number;

  /** UC11 A2 — chỉ purpose registration: sau 3 lần sai, khóa 5 phút */
  @Column({ type: 'timestamptz', nullable: true })
  verifyLockedUntil?: Date | null;
}
