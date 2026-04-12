import { Controller, Get } from '@nestjs/common';
import { RevenueDashboardService } from './revenue-dashboard.service';

@Controller('admin/revenue')
export class RevenueDashboardController {
  constructor(private readonly service: RevenueDashboardService) {}

  /**
   * GET /admin/revenue/dashboard
   * UC40: Xem dashboard doanh thu
   */
  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }
}
