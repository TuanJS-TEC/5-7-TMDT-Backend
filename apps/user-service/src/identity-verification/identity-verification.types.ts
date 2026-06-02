export type DocumentType = 'cccd' | 'cmnd';

export type VerificationStatus =
  | 'none'
  | 'pending_admin_review'
  | 'approved'
  | 'rejected';

export type AiCheckStatus = 'pending' | 'passed' | 'failed';

export interface VerificationRequest {
  id: string;
  userId: string;
  documentType: DocumentType;
  idImageUrl: string;
  aiCheckStatus: AiCheckStatus;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
  rejectionReason?: string;
}
