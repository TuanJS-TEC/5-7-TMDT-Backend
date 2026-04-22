import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { FormField } from '../components/ui/FormField';
import { PageError } from '../components/ui/PageState';

interface PackageInfo { type: string; name: string; priceVnd: number; durationDays: number; description: string; }
interface PaymentMethodRow { type: string; name: string; isActive: boolean; }
interface CreateOrderRes { success: boolean; data: { orderId: string; status: string; message: string }; }
interface OrderView { orderId: string; status: string; paymentMethod: string; amountVnd: number; listingPackageType: string; createdAt: string; updatedAt: string; }

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  paid:      'bg-emerald-100 text-emerald-800',
  failed:    'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const PACKAGE_ICONS: Record<string, string> = { basic: '📄', premium: '💎', vip: '⭐' };

export function SellerOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages,      setPackages]      = useState<PackageInfo[]>([]);
  const [methods,       setMethods]       = useState<PaymentMethodRow[]>([]);
  const [pkgType,       setPkgType]       = useState('premium');
  const [method,        setMethod]        = useState('bank_transfer');
  const [amount,        setAmount]        = useState(99_000);
  const [lastOrderId,   setLastOrderId]   = useState<string | null>(null);
  const [order,         setOrder]         = useState<OrderView | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [pollLoading,   setPollLoading]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pkgs, meth] = await Promise.all([
          api<PackageInfo[]>('/listings/packages'),
          api<PaymentMethodRow[]>('/payments/methods'),
        ]);
        if (cancelled) return;
        setPackages(pkgs);
        setMethods(meth.filter(x => x.isActive));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const p = packages.find(x => x.type === pkgType);
    if (p) setAmount(p.priceVnd);
  }, [pkgType, packages]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null); setOrder(null);
    try {
      const res = await api<CreateOrderRes>('/payments/orders', {
        method: 'POST',
        body: JSON.stringify({ listingPackageType: pkgType, paymentMethod: method, amountVnd: amount }),
      });
      setLastOrderId(res.data.orderId);
      setSuccess(res.data.message);
      toast('Tạo đơn thanh toán thành công', 'success');
      await refreshOrder(res.data.orderId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được đơn');
      toast('Không tạo được đơn thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrder(id?: string) {
    const oid = id ?? lastOrderId; if (!oid) return;
    setPollLoading(true); setError(null);
    try {
      const res = await api<{ success: boolean; data: OrderView }>(`/payments/orders/${encodeURIComponent(oid)}`);
      setOrder(res.data);
      toast('Đã cập nhật trạng thái đơn', 'info', 2200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đọc được đơn');
      toast('Không đọc được trạng thái đơn', 'error');
    } finally {
      setPollLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">📦 Đơn thanh toán gói tin</h1>
        <p className="mt-1 text-sm text-muted">
          Tài khoản: <strong>{user?.fullName}</strong> · Luồng UC27–28 — JWT → Gateway → payment-service
        </p>
      </div>

      {/* Package selector */}
      {packages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Chọn gói tin</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {packages.map(pkg => (
              <button
                key={pkg.type}
                type="button"
                onClick={() => setPkgType(pkg.type)}
                className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 ${pkgType === pkg.type ? 'border-brand-500 bg-brand-50 shadow-sm shadow-brand-200' : 'border-brand-100 hover:border-brand-300'}`}
              >
                <div className="text-2xl mb-1">{PACKAGE_ICONS[pkg.type] ?? '📋'}</div>
                <div className="font-bold text-sm text-ink">{pkg.name}</div>
                <div className="text-brand-700 font-semibold text-sm mt-0.5">
                  {new Intl.NumberFormat('vi-VN').format(pkg.priceVnd)} ₫
                </div>
                <div className="text-xs text-muted">{pkg.durationDays} ngày</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order form */}
      <form onSubmit={createOrder} className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Tạo đơn thanh toán</h2>

        {error   && <PageError message={error} />}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">✓ {success}</div>}

        <FormField label="Gói tin" htmlFor="order-package" required>
          <select id="order-package" className="input-base" value={pkgType} onChange={e => setPkgType(e.target.value)}>
            {packages.length > 0
              ? packages.map(p => <option key={p.type} value={p.type}>{p.name} — {new Intl.NumberFormat('vi-VN').format(p.priceVnd)} ₫ / {p.durationDays} ngày</option>)
              : <option value="premium">Premium — 99.000 ₫</option>
            }
          </select>
        </FormField>

        <FormField label="Phương thức thanh toán" htmlFor="order-method" required>
          <select id="order-method" className="input-base" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="bank_transfer">🏦 Chuyển khoản ngân hàng</option>
            {methods.map(m => <option key={m.type} value={m.type}>{m.name}</option>)}
          </select>
        </FormField>

        <FormField label="Số tiền (VND)" htmlFor="order-amount" required hint={`≈ ${(amount / 1_000).toFixed(0)} nghìn ₫`}>
          <input id="order-amount" type="number" className="input-base" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} required />
        </FormField>

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? <><Spinner size="sm" className="text-white" /> Đang tạo đơn…</> : '💳 Tạo đơn thanh toán'}
        </button>
      </form>

      {/* Order status */}
      {lastOrderId && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand-900">Trạng thái đơn</h2>
            <button
              type="button"
              onClick={() => refreshOrder()}
              disabled={pollLoading}
              className="btn btn-secondary py-1.5 px-3 text-sm"
            >
              {pollLoading ? <Spinner size="sm" /> : '↻'} Làm mới
            </button>
          </div>
          <p className="font-mono text-xs text-muted">ID: {lastOrderId}</p>
          {order && (
            <dl className="divide-y divide-brand-50">
              {[
                { label: 'Trạng thái', value: <span className={`badge ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>{order.status}</span> },
                { label: 'Gói tin',    value: order.listingPackageType },
                { label: 'Số tiền',   value: `${new Intl.NumberFormat('vi-VN').format(order.amountVnd)} ₫` },
                { label: 'Phương thức', value: order.paymentMethod },
                { label: 'Cập nhật',  value: new Date(order.updatedAt).toLocaleString('vi-VN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink text-right">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
