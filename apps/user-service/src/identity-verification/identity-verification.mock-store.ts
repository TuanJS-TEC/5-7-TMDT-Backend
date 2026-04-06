import { Injectable } from '@nestjs/common';
import type { MockUser, VerificationRequest } from './identity-verification.types';

@Injectable()
export class IdentityVerificationMockStore {
  readonly users = new Map<string, MockUser>([
    [
      'u_buyer_001',
      {
        id: 'u_buyer_001',
        fullName: 'Nguyen Van Buyer',
        canSell: false,
        verificationStatus: 'none',
      },
    ],
    [
      'u_buyer_002',
      {
        id: 'u_buyer_002',
        fullName: 'Tran Thi Buyer',
        canSell: false,
        verificationStatus: 'none',
      },
    ],
    [
      'u_seller_001',
      {
        id: 'u_seller_001',
        fullName: 'Le Van Seller',
        canSell: true,
        verificationStatus: 'approved',
        latestRequestId: 'ivr_seed_approved_001',
      },
    ],
  ]);

  readonly requests = new Map<string, VerificationRequest>([
    [
      'ivr_seed_approved_001',
      {
        id: 'ivr_seed_approved_001',
        userId: 'u_seller_001',
        documentType: 'cccd',
        idImageUrl: 'https://mock-storage.local/id/u_seller_001_cccd.jpg',
        aiCheckStatus: 'passed',
        status: 'approved',
        submittedAt: '2026-01-20T08:00:00.000Z',
        reviewedAt: '2026-01-20T09:00:00.000Z',
        reviewedBy: 'admin_seed_001',
        adminNote: 'Da duyet tu mock data',
      },
    ],
  ]);

  private sequence = 1;

  nextRequestId(): string {
    const id = `ivr_${Date.now()}_${String(this.sequence).padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}
