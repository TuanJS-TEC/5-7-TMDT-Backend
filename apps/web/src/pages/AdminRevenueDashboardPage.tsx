import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { Spinner } from '../components/ui/Spinner';
import { PageError } from '../components/ui/PageState';
import { AppIcon, PRICE_ICON } from '../components/icons';

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

interface RevenueDashboardDto {
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

function currency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

export function AdminRevenueDashboardPage() {
  const [data, setData] = useState<RevenueDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refreshOnly = false) {
    if (refreshOnly) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api<RevenueDashboardDto>('/admin/revenue/dashboard');
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được dashboard doanh thu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" className="text-amber-600" />
      </div>
    );
  }

  if (error || !data) {
    return <PageError message={error ?? 'Không có dữ liệu'} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-amber-950 inline-flex items-center gap-2">
            <AppIcon name="dashboard" size="md" alt="" /> Dashboard doanh thu
          </h1>
          <p className="mt-1 text-sm text-muted">Use case 40 — Tổng quan doanh thu từ gói tin đã thanh toán.</p>
        </div>
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={refreshing}
          onClick={() => void load(true)}
        >
          {refreshing ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Tổng doanh thu</p>
          <p className="mt-1 text-xl font-bold text-ink">{currency(data.totalRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Doanh thu tháng này</p>
          <p className="mt-1 text-xl font-bold text-ink">{currency(data.thisMonthRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Doanh thu tháng trước</p>
          <p className="mt-1 text-xl font-bold text-ink">{currency(data.lastMonthRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Tăng trưởng</p>
          <p className={`mt-1 text-xl font-bold ${data.growthPercent >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {data.growthPercent}%
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-ink">
            <AppIcon name={PRICE_ICON} size="sm" alt="" /> Doanh thu theo gói
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>VIP</span><strong>{currency(data.byPackage.vip)}</strong></div>
            <div className="flex items-center justify-between"><span>Premium</span><strong>{currency(data.byPackage.premium)}</strong></div>
            <div className="flex items-center justify-between"><span>Basic</span><strong>{currency(data.byPackage.basic)}</strong></div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold text-ink">Xu hướng 6 tháng</h2>
          <div className="mt-3 space-y-2">
            {data.monthlyTrend.length === 0 ? (
              <p className="text-sm text-muted">Chưa có dữ liệu giao dịch.</p>
            ) : (
              data.monthlyTrend.map((m) => (
                <div key={m.month} className="flex items-center justify-between text-sm">
                  <span>{m.month}</span>
                  <span className="text-muted">{m.transactionCount} giao dịch</span>
                  <strong>{currency(m.totalVnd)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Giao dịch gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-brand-50/70">
              <tr>
                <th className="px-4 py-3">Mã GD</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Thời điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {data.recentTransactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate" title={t.id}>{t.id}</td>
                  <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate" title={t.sellerId}>{t.sellerId}</td>
                  <td className="px-4 py-3">{t.packageType}</td>
                  <td className="px-4 py-3 font-semibold">{currency(t.amountVnd)}</td>
                  <td className="px-4 py-3 text-muted">{new Date(t.paidAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
              {data.recentTransactions.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={5}>Chưa có giao dịch nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
