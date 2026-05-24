/** Ảnh QR demo — đồng bộ với docs/VietQR/1779590931842.png */
export const VIETQR_DEMO_IMAGE = '/assets/vietqr/payment-qr.png';

export interface VietQrDisplayInfo {
  imageUrl?: string;
  transferContent?: string;
  expiresAt?: string;
  expired?: boolean;
  bankName?: string;
  accountNoMasked?: string;
  accountName?: string;
  amountVnd: number;
  orderId: string;
}

function formatVnd(vnd: number) {
  return new Intl.NumberFormat('vi-VN').format(vnd) + ' ₫';
}

function secondsLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

export function VietQrPaymentCard({
  info,
  onRegenerate,
  regenerating,
  onSimulateSuccess,
  simulating,
  orderStatus,
}: {
  info: VietQrDisplayInfo;
  onRegenerate?: () => void;
  regenerating?: boolean;
  /** Dev — mô phỏng webhook thanh toán thành công */
  onSimulateSuccess?: () => void;
  simulating?: boolean;
  orderStatus?: string;
}) {
  const src = info.imageUrl || VIETQR_DEMO_IMAGE;
  const left = secondsLeft(info.expiresAt);
  const demoViewUrl = `/api/v1/payments/demo-vietqr/orders/${encodeURIComponent(info.orderId)}`;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-emerald-900">Quét mã VietQR</h3>
          <p className="text-xs text-muted mt-0.5">{info.bankName ?? 'Chuyển khoản ngân hàng'}</p>
        </div>
        <span className="badge bg-emerald-100 text-emerald-800 shrink-0">UC28</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
          <img
            src={src}
            alt="Mã VietQR thanh toán"
            className="h-56 w-56 max-w-full object-contain"
            onError={(e) => {
              e.currentTarget.src = VIETQR_DEMO_IMAGE;
            }}
          />
        </div>
        <p className="text-xl font-bold text-emerald-700">{formatVnd(info.amountVnd)}</p>
      </div>

      <dl className="text-sm space-y-2 rounded-xl bg-white/80 border border-emerald-50 p-3">
        {info.accountName && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Chủ TK</dt>
            <dd className="font-medium text-right">{info.accountName}</dd>
          </div>
        )}
        {info.accountNoMasked && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Số TK</dt>
            <dd className="font-mono font-medium">{info.accountNoMasked}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Nội dung CK</dt>
          <dd className="font-mono text-xs font-medium text-right break-all">
            {info.transferContent ?? info.orderId}
          </dd>
        </div>
        {left !== null && (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Hết hạn QR</dt>
            <dd className={left === 0 || info.expired ? 'text-red-600 font-medium' : 'text-amber-700 font-medium'}>
              {info.expired || left === 0
                ? 'Đã hết hạn — bấm làm mới mã'
                : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        {orderStatus === 'success' && (
          <p className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Thanh toán thành công — gói tin đã được kích hoạt (nếu đã gắn mã tin đăng).
          </p>
        )}
        {onSimulateSuccess && orderStatus === 'pending' && (
          <button
            type="button"
            onClick={onSimulateSuccess}
            disabled={simulating}
            className="btn bg-emerald-600 text-white hover:bg-emerald-700 flex-1 min-w-[8rem] py-2 text-sm"
          >
            {simulating ? 'Đang xử lý…' : '✓ Mô phỏng thanh toán (dev)'}
          </button>
        )}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="btn btn-primary flex-1 min-w-[8rem] py-2 text-sm"
          >
            {regenerating ? 'Đang tạo…' : '↻ Làm mới mã QR'}
          </button>
        )}
        <a
          href={demoViewUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary py-2 text-sm"
        >
          Mở trang QR
        </a>
      </div>
    </div>
  );
}
