import { Module } from '@nestjs/common';
import { RevenueDashboardController } from './revenue-dashboard.controller';
import { RevenueDashboardService } from './revenue-dashboard.service';

@Module({
  controllers: [RevenueDashboardController],
  providers: [RevenueDashboardService],
})
export class RevenueDashboardModule {}
