import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

/** UC12: mục đích OTP — đăng ký / đặt lại MK / xác thực SĐT */
export type OtpPurpose = 'registration' | 'password_reset' | 'phone_verify';

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

  /** UC12 A1 — sai tối đa 3 lần rồi xóa challenge, bắt gửi lại OTP */
  @Column({ type: 'int', default: 0 })
  wrongAttempts!: number;
}
