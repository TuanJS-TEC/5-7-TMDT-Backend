import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { FormField } from '../components/ui/FormField';
import { PageError } from '../components/ui/PageState';
import {
  VietQrPaymentCard,
  type VietQrDisplayInfo,
} from '../components/VietQrPaymentCard';
import { AppIcon, PACKAGE_ICON, PRICE_ICON, type AppIconName } from '../components/icons';

interface PackageInfo { type: string; name: string; priceVnd: number; durationDays: number; description: string; }
interface PaymentMethodRow { type: string; name: string; isActive: boolean; }
interface CreateOrderRes { success: boolean; data: { orderId: string; status: string; message: string }; }

interface OrderVietQr {
  imageUrl?: string;
  transferContent?: string;
  expiresAt?: string;
  expired?: boolean;
  bankName?: string;
  accountNoMasked?: string;
  accountName?: string;
}

interface OrderView {
  orderId: string;
  status: string;
  paymentMethod: string;
  amountVnd: number;
  listingPackageType: string;
  listingId?: string | null;
  createdAt: string;
  updatedAt: string;
  vietQr?: OrderVietQr;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  success:   'bg-emerald-100 text-emerald-800',
  paid:      'bg-emerald-100 text-emerald-800',
  failed:    'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export function SellerOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const listingIdFromUrl = searchParams.get('listingId')?.trim() || '';

  const [packages,      setPackages]      = useState<PackageInfo[]>([]);
  const [methods,       setMethods]       = useState<PaymentMethodRow[]>([]);
  const [pkgType,       setPkgType]       = useState('premium');
  const [method,        setMethod]        = useState('qr_banking');
  const [amount,        setAmount]        = useState(99_000);
  const [listingId,     setListingId]     = useState(listingIdFromUrl);
  const [lastOrderId,   setLastOrderId]   = useState<string | null>(null);
  const [order,         setOrder]         = useState<OrderView | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [pollLoading,   setPollLoading]   = useState(false);
  const [qrLoading,     setQrLoading]     = useState(false);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);

  useEffect(() => {
    setListingId(listingIdFromUrl);
  }, [listingIdFromUrl]);

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

  async function refreshOrder(id?: string) {
    const oid = id ?? lastOrderId; if (!oid) return;
    setPollLoading(true); setError(null);
    try {
      const res = await api<{ success: boolean; data: OrderView }>(`/payments/orders/${encodeURIComponent(oid)}`);
      setOrder(res.data);
      if (res.data.status === 'success') {
        setSuccess('Thanh toán thành công! Gói tin đã được kích hoạt trên tin đăng (nếu đã chọn mã tin).');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đọc được đơn');
      toast('Không đọc được trạng thái đơn', 'error');
    } finally {
      setPollLoading(false);
    }
  }

  async function generateVietQr(orderId: string) {
    setQrLoading(true);
    try {
      await api(`/payments/orders/${encodeURIComponent(orderId)}/vietqr`, { method: 'POST' });
      toast('Đã tạo mã VietQR', 'success');
      await refreshOrder(orderId);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Không tạo được mã QR', 'error');
    } finally {
      setQrLoading(false);
    }
  }

  async function simulatePayment(orderId: string) {
    setSimulateLoading(true);
    setError(null);
    try {
      const res = await api<{ success: boolean; code: string; message?: string }>(
        `/payments/orders/${encodeURIComponent(orderId)}/simulate-success`,
        { method: 'POST' },
      );
      if (res.success) {
        toast('Mô phỏng thanh toán thành công', 'success');
        await refreshOrder(orderId);
      } else {
        toast(res.message ?? 'Mô phỏng thất bại', 'error');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không mô phỏng được thanh toán';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSimulateLoading(false);
    }
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null); setOrder(null);
    try {
      const body: Record<string, unknown> = {
        listingPackageType: pkgType,
        paymentMethod: method,
        amountVnd: amount,
      };
      if (listingId.trim()) {
        body.listingId = listingId.trim();
      }
      const res = await api<CreateOrderRes>('/payments/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setLastOrderId(res.data.orderId);
      setSuccess(res.data.message);
      toast('Tạo đơn thanh toán thành công', 'success');
      if (method === 'qr_banking') {
        await generateVietQr(res.data.orderId);
      } else {
        await refreshOrder(res.data.orderId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được đơn');
      toast('Không tạo được đơn thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  }

  const vietQrCardInfo: VietQrDisplayInfo | null =
    order && order.paymentMethod === 'qr_banking'
      ? {
          orderId: order.orderId,
          amountVnd: order.amountVnd,
          imageUrl: order.vietQr?.imageUrl,
          transferContent: order.vietQr?.transferContent,
          expiresAt: order.vietQr?.expiresAt,
          expired: order.vietQr?.expired,
          bankName: order.vietQr?.bankName,
          accountNoMasked: order.vietQr?.accountNoMasked,
          accountName: order.vietQr?.accountName,
        }
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900 inline-flex items-center gap-2">
          <AppIcon name={PRICE_ICON} size="md" alt="" /> Đơn thanh toán gói tin
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tài khoản: <strong>{user?.fullName}</strong> · UC27–28 — demo VietQR + mô phỏng thanh toán dev
        </p>
        <p className="mt-2 text-xs text-muted">
          <Link to="/seller/listings" className="text-brand-700 hover:underline">← Tin của tôi</Link>
          {' · '}
          Chọn <strong>mã tin đăng</strong> để sau khi thanh toán gói được áp lên đúng xe.
        </p>
      </div>

      {packages.length > 0 && (
        <div>
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <AppIcon name={PRICE_ICON} size="sm" alt="" /> Chọn gói tin
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {packages.map(pkg => (
              <button
                key={pkg.type}
                type="button"
                onClick={() => setPkgType(pkg.type)}
                className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 ${pkgType === pkg.type ? 'border-brand-500 bg-brand-50 shadow-sm shadow-brand-200' : 'border-brand-100 hover:border-brand-300'}`}
              >
                <div className="mb-1 flex justify-center">
                  <AppIcon name={(PACKAGE_ICON[pkg.type] ?? 'layers') as AppIconName} size="lg" alt="" />
                </div>
                <div className="font-bold text-sm text-ink">{pkg.name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  <AppIcon name={PRICE_ICON} size="xs" alt="" />
                  {new Intl.NumberFormat('vi-VN').format(pkg.priceVnd)} ₫
                </div>
                <div className="text-xs text-muted">{pkg.durationDays} ngày</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={createOrder} className="card p-6 space-y-5">
        <h2 className="font-semibold text-ink">Tạo đơn thanh toán</h2>

        {error   && <PageError message={error} />}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
            <AppIcon name="priority" size="sm" alt="" />
            {success}
          </div>
        )}

        <FormField
          label="Mã tin đăng (tùy chọn)"
          htmlFor="order-listing-id"
          hint="Lấy từ trang Tin của tôi — gói sẽ áp lên tin sau khi thanh toán thành công"
        >
          <input
            id="order-listing-id"
            className="input-base font-mono text-sm"
            value={listingId}
            onChange={e => setListingId(e.target.value)}
            placeholder="uuid tin đăng"
          />
        </FormField>

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
            {methods.length > 0
              ? methods.map(m => (
                  <option key={m.type} value={m.type}>
                    {m.name}
                  </option>
                ))
              : (
                <>
                  <option value="qr_banking">QR Banking (VietQR)</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                </>
              )}
          </select>
        </FormField>

        <FormField label="Số tiền (VND)" htmlFor="order-amount" required hint={`≈ ${(amount / 1_000).toFixed(0)} nghìn ₫`}>
          <input id="order-amount" type="number" className="input-base" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} required />
        </FormField>

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? (
            <><Spinner size="sm" className="text-white" /> Đang tạo đơn…</>
          ) : (
            <span className="inline-flex items-center gap-2">
              <AppIcon name="vipCard" size="sm" alt="" className="brightness-0 invert" />
              Tạo đơn & hiển thị QR
            </span>
          )}
        </button>
      </form>

      {vietQrCardInfo && (
        <VietQrPaymentCard
          info={vietQrCardInfo}
          orderStatus={order?.status}
          onRegenerate={() => lastOrderId && void generateVietQr(lastOrderId)}
          regenerating={qrLoading}
          onSimulateSuccess={
            lastOrderId && order?.status === 'pending'
              ? () => void simulatePayment(lastOrderId)
              : undefined
          }
          simulating={simulateLoading}
        />
      )}

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
          {order?.listingId && (
            <p className="font-mono text-xs text-muted">Tin: {order.listingId}</p>
          )}
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
