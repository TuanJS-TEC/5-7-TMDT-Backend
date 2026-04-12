import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminIdentityVerificationModule } from './identity-verification/admin-identity-verification.module';
import { RevenueDashboardModule } from './revenue-dashboard/revenue-dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [
    AdminIdentityVerificationModule,
    RevenueDashboardModule,
    UserManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
