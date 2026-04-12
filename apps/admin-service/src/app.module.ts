import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@car-marketplace/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminIdentityVerificationModule } from './identity-verification/admin-identity-verification.module';
import { RevenueDashboardModule } from './revenue-dashboard/revenue-dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AdminIdentityVerificationModule,
    RevenueDashboardModule,
    UserManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
