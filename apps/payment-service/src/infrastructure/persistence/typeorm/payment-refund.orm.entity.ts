import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** UC34 — Lệnh hoàn tiền (sau khi thanh toán thành công) */
@Entity({ name: 'payment_refunds' })
@Index(['paymentOrderId'])
export class PaymentRefundOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  paymentOrderId!: string;

  @Column({ type: 'varchar', length: 128 })
  originalTransactionId!: string;

  @Column({ type: 'int' })
  amountVnd!: number;

  /** pending | processing | success | failed */
  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'uuid' })
  createdByAdminUserId!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  gatewayRefundReference!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
