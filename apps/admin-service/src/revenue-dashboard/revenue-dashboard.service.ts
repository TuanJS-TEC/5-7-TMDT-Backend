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

@Injectable()
export class RevenueDashboardService {
  constructor(
    @InjectRepository(PaymentOrderOrmEntity)
    private readonly paymentRepository: Repository<PaymentOrderOrmEntity>,
  ) {}

  /**
   * UC40: Lấy dữ liệu tổng hợp dashboard doanh thu từ Database
   */
  async getDashboard(): Promise<RevenueDashboardDto> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Tổng doanh thu (Chỉ tính các đơn COMPLETED)
    const totalResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.amountVnd)', 'total')
      .where('p.status = :status', { status: 'COMPLETED' })
      .getRawOne();
    const totalRevenue = parseInt(totalResult?.total || '0', 10);

    // 2. Doanh thu tháng này
    const thisMonthResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.amountVnd)', 'total')
      .where('p.status = :status', { status: 'COMPLETED' })
      .andWhere('p.createdAt >= :start', { start: firstDayThisMonth })
      .getRawOne();
    const thisMonthRevenue = parseInt(thisMonthResult?.total || '0', 10);

    // 3. Doanh thu tháng trước
    const lastMonthResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('SUM(p.amountVnd)', 'total')
      .where('p.status = :status', { status: 'COMPLETED' })
      .andWhere('p.createdAt BETWEEN :start AND :end', { 
        start: firstDayLastMonth, 
        end: lastDayLastMonth 
      })
      .getRawOne();
    const lastMonthRevenue = parseInt(lastMonthResult?.total || '0', 10);

    // 4. Phần trăm tăng trưởng
    let growthPercent = 0;
    if (lastMonthRevenue > 0) {
      growthPercent = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10;
    }

    // 5. Phân loại theo gói (Package distribution)
    const packageStats = await this.paymentRepository
      .createQueryBuilder('p')
      .select('p.listingPackageType', 'type')
      .addSelect('SUM(p.amountVnd)', 'total')
      .where('p.status = :status', { status: 'COMPLETED' })
      .groupBy('p.listingPackageType')
      .getRawMany();

    const byPackage = {
      vip: parseInt(packageStats.find(s => s.type === 'vip')?.total || '0', 10),
      premium: parseInt(packageStats.find(s => s.type === 'premium')?.total || '0', 10),
      basic: parseInt(packageStats.find(s => s.type === 'basic')?.total || '0', 10),
    };

    // 6. Giao dịch gần đây
    const recentEntities = await this.paymentRepository.find({
      where: { status: 'COMPLETED' },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentTransactions: RecentTransaction[] = recentEntities.map(e => ({
      id: e.id,
      sellerId: e.userId,
      packageType: e.listingPackageType,
      amountVnd: e.amountVnd,
      paidAt: e.createdAt.toISOString(),
    }));

    // 7. Xu hướng 6 tháng gần nhất
    const trendResults = await this.paymentRepository
      .createQueryBuilder('p')
      .select("TO_CHAR(p.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(p.amountVnd)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :status', { status: 'COMPLETED' })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .limit(6)
      .getRawMany();

    const monthlyTrend: MonthlyRevenue[] = trendResults.map(r => ({
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
