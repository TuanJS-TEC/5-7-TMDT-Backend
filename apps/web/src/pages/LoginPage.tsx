import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { FormField } from '../components/ui/FormField';
import { PageError } from '../components/ui/PageState';

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ phone: false, password: false });

  const phoneNormalized = phone.trim();
  const phoneValid = /^0\d{9,10}$/.test(phoneNormalized);
  const passwordValid = password.length >= 8;
  const formValid = phoneValid && passwordValid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ phone: true, password: true });
    if (!formValid) {
      setError('Vui lòng kiểm tra lại số điện thoại và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(phoneNormalized, password);
      toast('Đăng nhập thành công', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
      toast('Đăng nhập thất bại', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] animate-fade-in space-y-6">
      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40 p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Đăng nhập tài khoản</h1>
        <p className="mt-2 text-sm text-muted">Tiếp tục hành trình tìm xe, lưu xe yêu thích và liên hệ người bán.</p>
      </section>

      <div className="w-full overflow-hidden rounded-3xl shadow-xl shadow-brand-900/10 border border-brand-100 grid lg:grid-cols-2">
        {/* ── Left: Brand panel ── */}
        <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-10 text-white overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-brand-400/20 blur-2xl" />
          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 font-display text-xl font-bold">C</span>
              <span className="font-display text-xl font-bold">Car Marketplace</span>
            </Link>
          </div>
          <div className="relative">
            <div className="text-5xl mb-6">🚗</div>
            <h2 className="font-display text-2xl font-bold leading-snug">
              Find, Buy, Sell<br />
              <span className="text-brand-200">all in one place</span>
            </h2>
            <p className="mt-3 text-sm text-white/65 leading-relaxed">
              Khám phá hàng nghìn xe đã qua sử dụng, lưu yêu thích, và liên hệ người bán ngay hôm nay.
            </p>
          </div>
          <div className="relative flex flex-col gap-3">
            {[
              { icon: '✓', text: 'Tin đăng đã được kiểm duyệt' },
              { icon: '✓', text: 'Thông tin người bán xác thực' },
              { icon: '✓', text: 'Giao dịch an toàn, minh bạch' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-300 text-xs font-bold">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="bg-white px-8 py-10 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="font-display text-2xl font-bold text-brand-900">Đăng nhập</h1>
            <p className="mt-1.5 text-sm text-muted">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:underline">Đăng ký ngay</Link>
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              {error && <PageError message={error} />}

              <FormField
                label="Số điện thoại"
                htmlFor="login-phone"
                required
                error={touched.phone && !phoneValid ? 'Định dạng hợp lệ: bắt đầu bằng số 0 và có 10-11 chữ số.' : null}
              >
                <input
                  id="login-phone"
                  className="input-base"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                  autoComplete="tel"
                  placeholder="0912 345 678"
                  inputMode="tel"
                  aria-invalid={touched.phone && !phoneValid}
                  autoFocus
                  required
                />
              </FormField>

              <FormField
                label="Mật khẩu"
                htmlFor="login-password"
                required
                error={touched.password && !passwordValid ? 'Mật khẩu tối thiểu 8 ký tự.' : null}
              >
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="current-password"
                    aria-invalid={touched.password && !passwordValid}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </FormField>

              <button
                type="submit"
                disabled={loading || !formValid}
                className="btn btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? <><Spinner size="sm" className="text-white" /> Đang xử lý…</> : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <p className="text-xs text-center text-muted font-medium">Demo accounts</p>
              <div className="mt-2 space-y-1 text-xs text-muted text-center">
                <p>👤 Người mua · 👔 Người bán (showroom) · 🛡 Admin</p>
                <p className="text-brand-600">Đăng ký tài khoản mới để thử nghiệm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
