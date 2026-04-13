import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_orders' })
@Index(['userId'])
@Index(['status', 'paymentMethod'])
export class PaymentOrderOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 64 })
  listingPackageType!: string;

  /** Tin đăng cần áp gói sau khi thanh toán (tuỳ chọn) */
  @Column({ type: 'uuid', nullable: true })
  listingId!: string | null;

  @Column({ type: 'varchar', length: 32 })
  paymentMethod!: string;

  @Column({ type: 'int' })
  amountVnd!: number;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  transactionId!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'text', nullable: true })
  vietQrImageUrl!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  vietQrGeneratedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  vietQrExpiresAt!: Date | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  transferContent!: string | null;

  /** UC29 — URL trang thanh toán ví (sandbox / cổng thật) */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  walletPayUrl!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  walletSessionExpiresAt!: Date | null;

  /** UC30 — redirect cổng ATM/Internet Banking (sandbox) */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  atmPayUrl!: string | null;

  /** UC30 A3 — phiên cổng (mặc định 20 phút demo) */
  @Column({ type: 'timestamptz', nullable: true })
  atmSessionExpiresAt!: Date | null;

  /** UC34 — thời điểm hoàn tiền thành công */
  @Column({ type: 'timestamptz', nullable: true })
  refundedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
