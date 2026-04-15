export interface RecentTransaction { // THÊM EXPORT
  id: string;
  sellerId: string;
  packageType: string;
  amountVnd: number;
  paidAt: string;
}

export interface MonthlyRevenue {
  month: string;
  totalVnd: number;
  transactionCount: number;
}

// Giữ nguyên các mảng mock nếu cần cho test khác
export const mockRecentTransactions: RecentTransaction[] = [];
export const mockMonthlyRevenue: MonthlyRevenue[] = [];