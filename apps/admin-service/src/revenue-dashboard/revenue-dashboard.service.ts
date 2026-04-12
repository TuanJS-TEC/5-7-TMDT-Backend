import { Injectable } from '@nestjs/common';
import { MOCK_MONTHLY_TREND, MOCK_TRANSACTIONS, RecentTransaction, MonthlyRevenue } from './revenue-dashboard.mock';

export interface RevenueDashboardDto {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  growthPercent: number;
  byPackage: {
    vip: number;
    premium: number;
    basic: number;
  };
  recentTransactions: RecentTransaction[];
  monthlyTrend: MonthlyRevenue[];
}

@Injectable()
export class RevenueDashboardService {
  /**
   * UC40: Lấy dữ liệu tổng hợp dashboard doanh thu
   */
  getDashboard(): RevenueDashboardDto {
    const totalRevenue = MOCK_MONTHLY_TREND.reduce((sum, m) => sum + m.totalVnd, 0);
    const thisMonthRevenue = MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 1].totalVnd;
    const lastMonthRevenue = MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 2].totalVnd;
    const growthPercent = Math.round(
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10,
    ) / 10;

    const byPackage = {
      vip: MOCK_TRANSACTIONS.filter((t) => t.packageType === 'vip').reduce((s, t) => s + t.amountVnd, 0),
      premium: MOCK_TRANSACTIONS.filter((t) => t.packageType === 'premium').reduce((s, t) => s + t.amountVnd, 0),
      basic: MOCK_TRANSACTIONS.filter((t) => t.packageType === 'basic').reduce((s, t) => s + t.amountVnd, 0),
    };

    return {
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      growthPercent,
      byPackage,
      recentTransactions: [...MOCK_TRANSACTIONS].reverse().slice(0, 5),
      monthlyTrend: MOCK_MONTHLY_TREND,
    };
  }
}
