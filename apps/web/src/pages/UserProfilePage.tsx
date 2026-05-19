import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

function roleLabel(role: string) {
  if (role === 'admin')  return 'Quản trị viên';
  if (role === 'seller') return 'Người bán';
  return 'Người mua';
}

function roleBgClass(role: string) {
  if (role === 'admin')  return 'from-amber-400 to-orange-500';
  if (role === 'seller') return 'from-purple-400 to-violet-500';
  return 'from-brand-400 to-brand-600';
}

export function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="font-display text-xl font-bold text-brand-900">Chưa đăng nhập</h1>
      <p className="mt-2 text-muted">Vui lòng đăng nhập để xem trang này.</p>
      <Link to="/login" className="btn btn-primary mt-6">Đăng nhập</Link>
    </div>
  );

  const currentUser = user;
  const initials = currentUser.fullName.split(' ').slice(-2).map(w => w[0]?.toUpperCase() ?? '').join('');

  async function copyUserId() {
    try {
      await navigator.clipboard.writeText(currentUser.id);
      toast('Đã sao chép User ID', 'success');
    } catch {
      toast('Không thể sao chép User ID', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in" aria-live="polite">
      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40 p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">My account</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-muted">Quản lý thông tin tài khoản, vai trò và thao tác nhanh trong một nơi.</p>
      </section>

      <div className="card overflow-hidden">
        <div className={`h-24 bg-gradient-to-br ${roleBgClass(currentUser.role)}`} />
        <div className="px-6 pb-6">
          <div className={`-mt-10 mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br ${roleBgClass(currentUser.role)} font-display text-2xl font-bold text-white shadow-lg`}>
            {initials || '?'}
          </div>

          <h2 className="font-display text-xl font-bold text-brand-900 break-words">{currentUser.fullName}</h2>
          <p className="text-sm text-muted">{currentUser.phone}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`badge ${
              currentUser.role === 'admin'  ? 'bg-amber-100 text-amber-800' :
              currentUser.role === 'seller' ? 'bg-purple-100 text-purple-800' :
              'bg-brand-100 text-brand-700'
            }`}>
              {roleLabel(currentUser.role)}
            </span>
            <span className="badge bg-gray-100 text-gray-700">{currentUser.accountType}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-5 text-center">
          <p className="font-display text-2xl font-bold text-brand-700">{currentUser.freeListingCredits}</p>
          <p className="text-xs text-muted mt-1">Tin đăng miễn phí</p>
        </div>
        <div className="card p-5 text-center">
          <p className="font-display text-2xl font-bold text-brand-700">—</p>
          <p className="text-xs text-muted mt-1">Tin đã đăng</p>
        </div>
        <div className="card p-5 text-center col-span-2 sm:col-span-1">
          <p className="font-display text-2xl font-bold text-brand-700">—</p>
          <p className="text-xs text-muted mt-1">Yêu thích</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-ink">Thông tin tài khoản</h3>
        <dl className="divide-y divide-brand-50">
          {[
            { label: 'Họ tên',          value: currentUser.fullName },
            { label: 'Số điện thoại',   value: currentUser.phone },
            { label: 'Loại tài khoản',  value: currentUser.accountType },
            { label: 'Vai trò',         value: roleLabel(currentUser.role) },
            { label: 'User ID',         value: <span className="font-mono text-xs text-muted">{currentUser.id}</span> },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium text-ink max-w-[65%] break-all text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="pt-2">
          <button type="button" className="btn btn-secondary py-1.5 px-3 text-sm" onClick={() => void copyUserId()}>
            Sao chép User ID
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-ink mb-4">Thao tác nhanh</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {currentUser.role === 'seller' && (
            <>
              <Link to="/seller/listing/new" className="btn btn-primary justify-center">+ Đăng tin bán xe</Link>
              <Link to="/seller/orders"      className="btn btn-secondary justify-center">📦 Đơn thanh toán</Link>
            </>
          )}
          {currentUser.role === 'admin' && (
            <Link to="/admin/moderation" className="btn btn-secondary justify-center sm:col-span-2">🛡 Kiểm duyệt tin đăng</Link>
          )}
          <Link to="/favorites" className="btn btn-secondary justify-center">♥ Xe đã lưu</Link>
          <Link to="/"          className="btn btn-ghost   justify-center">🚗 Xem xe đang bán</Link>
        </div>
      </div>

      <section className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Status</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{roleLabel(currentUser.role)}</h3>
          <p className="mt-2 text-sm text-muted">Role hiện tại xác định quyền truy cập tính năng trên hệ thống.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Account Type</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{currentUser.accountType}</h3>
          <p className="mt-2 text-sm text-muted">Loại tài khoản phục vụ nhu cầu mua xe cá nhân hoặc bán xe chuyên nghiệp.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Credits</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{currentUser.freeListingCredits} free</h3>
          <p className="mt-2 text-sm text-muted">Theo dõi số lượt đăng miễn phí trước khi cần nâng cấp gói.</p>
        </div>
      </section>
    </div>
  );
}
