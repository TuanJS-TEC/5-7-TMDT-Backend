export interface ApproveIdentityVerificationDto {
  adminId: string;
  note?: string;
}

export interface RejectIdentityVerificationDto {
  adminId: string;
  reason: string;
}
