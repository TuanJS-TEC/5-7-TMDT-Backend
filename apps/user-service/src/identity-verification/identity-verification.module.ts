import { Module } from '@nestjs/common';
import { IdentityVerificationController } from './identity-verification.controller';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityVerificationMockStore } from './identity-verification.mock-store';

@Module({
  controllers: [IdentityVerificationController],
  providers: [IdentityVerificationService, IdentityVerificationMockStore],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
