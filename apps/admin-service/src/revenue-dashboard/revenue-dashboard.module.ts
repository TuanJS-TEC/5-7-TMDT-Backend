import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrderOrmEntity } from '@car-marketplace/database';
import { RevenueDashboardController } from './revenue-dashboard.controller';
import { RevenueDashboardService } from './revenue-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrderOrmEntity])],
  controllers: [RevenueDashboardController],
  providers: [RevenueDashboardService],
})
export class RevenueDashboardModule {}
