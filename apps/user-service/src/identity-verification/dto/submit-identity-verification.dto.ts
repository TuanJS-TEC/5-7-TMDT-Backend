import type { DocumentType } from '../identity-verification.types';

export interface SubmitIdentityVerificationDto {
  userId: string;
  idImageUrl: string;
  documentType?: DocumentType;
}
