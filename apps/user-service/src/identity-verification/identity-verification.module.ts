import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityVerificationController } from './identity-verification.controller';
import { IdentityVerificationService } from './identity-verification.service';
import { UserEntity } from '../users/user.entity';
import { IdentityVerificationRequestEntity } from './identity-verification-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, IdentityVerificationRequestEntity])],
  controllers: [IdentityVerificationController],
  providers: [IdentityVerificationService],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
