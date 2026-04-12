import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrderOrmEntity } from '../../../../libs/database/src/entities/payment-order.orm.entity';
import { RevenueDashboardController } from './revenue-dashboard.controller';
import { RevenueDashboardService } from './revenue-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrderOrmEntity])],
  controllers: [RevenueDashboardController],
  providers: [RevenueDashboardService],
})
export class RevenueDashboardModule {}
