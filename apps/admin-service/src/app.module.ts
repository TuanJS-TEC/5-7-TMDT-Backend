import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminIdentityVerificationModule } from './identity-verification/admin-identity-verification.module';

@Module({
  imports: [AdminIdentityVerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
