import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrderOrmEntity } from '@car-marketplace/database';

interface RecentTransaction {
  id: string;
  sellerId: string;
  packageType: string;
  amountVnd: number;
  paidAt: string;
}

interface MonthlyRevenue {
  month: string;
  totalVnd: number;
  transactionCount: number;
}

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

/** Trạng thái đơn đã thanh toán thành công (payment-service lưu `success`, không phải COMPLETED). */
const PAID_ORDER_STATUS = 'success';

@Injectable()
export class RevenueDashboardService {
  constructor(
    @InjectRepository(PaymentOrderOrmEntity)
    private readonly paymentRepository: Repository<PaymentOrderOrmEntity>,
  ) {}

  private paidOrdersQb() {
    return this.paymentRepository
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PAID_ORDER_STATUS });
  }

  /**
   * UC40: Lấy dữ liệu tổng hợp dashboard doanh thu từ Database
   */
  async getDashboard(): Promise<RevenueDashboardDto> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. Tổng doanh thu (đơn đã thanh toán thành công)
    const totalResult = await this.paidOrdersQb()
      .select('SUM(p.amountVnd)', 'total')
      .getRawOne();
    const totalRevenue = parseInt(totalResult?.total || '0', 10);

    // 2. Doanh thu tháng này (theo thời điểm hoàn tất thanh toán)
    const thisMonthResult = await this.paidOrdersQb()
      .select('SUM(p.amountVnd)', 'total')
      .andWhere('p.updatedAt >= :start', { start: firstDayThisMonth })
      .getRawOne();
    const thisMonthRevenue = parseInt(thisMonthResult?.total || '0', 10);

    // 3. Doanh thu tháng trước
    const lastMonthResult = await this.paidOrdersQb()
      .select('SUM(p.amountVnd)', 'total')
      .andWhere('p.updatedAt >= :start AND p.updatedAt < :end', {
        start: firstDayLastMonth,
        end: firstDayThisMonth,
      })
      .getRawOne();
    const lastMonthRevenue = parseInt(lastMonthResult?.total || '0', 10);

    // 4. Phần trăm tăng trưởng
    let growthPercent = 0;
    if (lastMonthRevenue > 0) {
      growthPercent = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10;
    } else if (thisMonthRevenue > 0) {
      growthPercent = 100;
    }

    // 5. Phân loại theo gói (Package distribution)
    const packageStats = await this.paidOrdersQb()
      .select('p.listingPackageType', 'type')
      .addSelect('SUM(p.amountVnd)', 'total')
      .groupBy('p.listingPackageType')
      .getRawMany();

    const byPackage = {
      vip: parseInt(packageStats.find(s => s.type === 'vip')?.total || '0', 10),
      premium: parseInt(packageStats.find(s => s.type === 'premium')?.total || '0', 10),
      basic: parseInt(packageStats.find(s => s.type === 'basic')?.total || '0', 10),
    };

    // 6. Giao dịch gần đây
    const recentEntities = await this.paymentRepository.find({
      where: { status: PAID_ORDER_STATUS },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    const recentTransactions: RecentTransaction[] = recentEntities.map(e => ({
      id: e.id,
      sellerId: e.userId,
      packageType: e.listingPackageType,
      amountVnd: e.amountVnd,
      paidAt: e.updatedAt.toISOString(),
    }));

    // 7. Xu hướng 6 tháng gần nhất (theo tháng hoàn tất thanh toán)
    const trendResults = await this.paidOrdersQb()
      .select("TO_CHAR(p.updatedAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(p.amountVnd)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(6)
      .getRawMany();

    const monthlyTrend: MonthlyRevenue[] = trendResults.reverse().map(r => ({
      month: r.month,
      totalVnd: parseInt(r.total, 10),
      transactionCount: parseInt(r.count, 10),
    }));

    return {
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      growthPercent,
      byPackage,
      recentTransactions,
      monthlyTrend,
    };
  }
}
