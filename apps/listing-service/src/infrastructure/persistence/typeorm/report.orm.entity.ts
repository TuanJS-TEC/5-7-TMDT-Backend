import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';

@Entity({ name: 'reports' })
export class ReportOrmEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  listingId?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'listing' })
  targetType!: 'listing' | 'account';

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({ type: 'uuid' })
  reporterId!: string;

  @Column({ type: 'varchar', length: 64 })
  reason!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: string;

  @Column({ type: 'simple-array', nullable: true })
  evidenceImages?: string[];

  @Column({ type: 'simple-array', nullable: true })
  evidenceMessages?: string[];

  @Column({ type: 'simple-array', nullable: true })
  evidenceVideos?: string[];

  @Column({ type: 'uuid', nullable: true })
  processedBy?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  processedAction?: string | null;

  @Column({ type: 'text', nullable: true })
  processedNote?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  actionExecutionStatus?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  notificationPrimaryChannel?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  notificationFinalChannel?: string | null;

  @Column({ type: 'boolean', nullable: true })
  notificationFallbackUsed?: boolean | null;
}
