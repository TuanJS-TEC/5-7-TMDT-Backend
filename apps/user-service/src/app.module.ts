import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityVerificationModule } from './identity-verification/identity-verification.module';

@Module({
  imports: [IdentityVerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
