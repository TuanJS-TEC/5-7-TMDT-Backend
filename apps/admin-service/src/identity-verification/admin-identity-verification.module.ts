import { Module } from '@nestjs/common';
import { AdminIdentityVerificationController } from './admin-identity-verification.controller';
import { AdminIdentityVerificationService } from './admin-identity-verification.service';

@Module({
  controllers: [AdminIdentityVerificationController],
  providers: [AdminIdentityVerificationService],
})
export class AdminIdentityVerificationModule {}
