import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@car-marketplace/database';
import type { AiCheckStatus, DocumentType, VerificationStatus } from './identity-verification.types';

@Entity({ name: 'identity_verification_requests' })
export class IdentityVerificationRequestEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 16, default: 'cccd' })
  documentType!: DocumentType;

  @Column({ type: 'varchar', length: 1024 })
  idImageUrl!: string;

  @Column({ type: 'varchar', length: 32, default: 'passed' })
  aiCheckStatus!: AiCheckStatus;

  @Column({ type: 'varchar', length: 32, default: 'pending_admin_review' })
  status!: VerificationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  adminNote?: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;
}
