import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { FormField } from '../components/ui/FormField';
import { PageError } from '../components/ui/PageState';

const STEPS = ['Thông tin', 'Xác thực OTP'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const done    = idx < current;
        const active  = idx === current;
        return (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-brand-600 border-brand-600 text-white scale-110 shadow-lg shadow-brand-500/25' :
                         'border-brand-200 text-muted bg-white'
              }`}>
                {done ? '✓' : idx + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-brand-700' : done ? 'text-emerald-600' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors duration-500 ${done ? 'bg-emerald-400' : 'bg-brand-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RegisterPage() {
  const { registerVerify } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1>(0);
  const [fullName, setFullName]       = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'showroom'>('personal');
  const [code, setCode]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [info, setInfo]               = useState<string | null>(null);
  const [touched, setTouched]         = useState({ fullName: false, phone: false, password: false, code: false });

  const fullNameValid = fullName.trim().length >= 2;
  const phoneValid = /^0\d{9,10}$/.test(phone.trim());
  const passwordValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  const otpValid = /^\d{6}$/.test(code.trim());
  const step0Valid = fullNameValid && phoneValid && passwordValid;

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, fullName: true, phone: true, password: true }));
    if (!step0Valid) {
      setError('Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    setLoading(true); setError(null); setInfo(null);
    try {
      const res = await api<{ otpTtlSeconds: number; message: string }>('/auth/register/request-otp', {
        method: 'POST',
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim(), password, accountType }),
        skipAuth: true,
      });
      setInfo(`${res.message} Kiểm tra log terminal auth-service (môi trường dev).`);
      toast('Đã gửi OTP xác thực', 'success');
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được OTP');
      toast('Không gửi được OTP', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, code: true }));
    if (!otpValid) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await registerVerify(phone.trim(), code.trim());
      toast('Đăng ký thành công', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xác thực thất bại');
      toast('Xác thực OTP thất bại', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in space-y-6">
      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40 p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Create account</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Đăng ký tài khoản mới</h1>
        <p className="mt-2 text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Đăng nhập</Link>
        </p>
      </section>

      <div className="mx-auto w-full max-w-lg">
        <div className="card p-8">
          <StepIndicator current={step} />

          {/* ── Step 0: Form ── */}
          {step === 0 && (
            <form onSubmit={requestOtp} className="space-y-5 animate-slide-up" noValidate>
              {error && <PageError message={error} />}

              <FormField label="Họ và tên" htmlFor="register-fullname" required error={touched.fullName && !fullNameValid ? 'Họ tên phải có ít nhất 2 ký tự.' : null}>
                <input id="register-fullname" className="input-base" value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))} required minLength={2} placeholder="Nguyễn Văn A" aria-invalid={touched.fullName && !fullNameValid} />
              </FormField>

              <FormField label="Số điện thoại" htmlFor="register-phone" required error={touched.phone && !phoneValid ? 'Số điện thoại bắt đầu bằng 0 và dài 10-11 chữ số.' : null}>
                <input id="register-phone" className="input-base" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))} placeholder="0912345678" inputMode="tel" aria-invalid={touched.phone && !phoneValid} required />
              </FormField>

              <FormField
                label="Mật khẩu"
                htmlFor="register-password"
                required
                hint="Tối thiểu 8 ký tự, gồm chữ và số."
                error={touched.password && !passwordValid ? 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.' : null}
              >
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPwd ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    required minLength={8}
                    aria-invalid={touched.password && !passwordValid}
                  />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </FormField>

              {/* Account type cards */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Loại tài khoản</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'personal', icon: '👤', title: 'Cá nhân', sub: 'Mua xe → Vai trò người mua' },
                    { value: 'showroom', icon: '🏢', title: 'Showroom', sub: 'Bán xe → Vai trò người bán' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccountType(opt.value)}
                      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        accountType === opt.value
                          ? 'border-brand-500 bg-brand-50 shadow-sm shadow-brand-200'
                          : 'border-brand-100 hover:border-brand-300'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="font-semibold text-sm text-ink">{opt.title}</span>
                      <span className="text-xs text-muted leading-tight">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !step0Valid} className="btn btn-primary w-full py-3 text-base">
                {loading ? <><Spinner size="sm" className="text-white" /> Đang gửi OTP…</> : 'Gửi mã OTP →'}
              </button>
            </form>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <form onSubmit={verify} className="space-y-5 animate-slide-up" noValidate>
              {info && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
                  📱 {info}
                </div>
              )}
              {error && <PageError message={error} />}

              <div className="text-center">
                <p className="text-sm text-muted">Nhập mã OTP 6 chữ số đã gửi tới</p>
                <p className="font-semibold text-ink mt-0.5">{phone}</p>
              </div>

              <FormField
                label="Mã OTP"
                htmlFor="register-otp"
                required
                className="text-center"
                error={touched.code && !otpValid ? 'OTP gồm đúng 6 chữ số.' : null}
              >
                <input
                  id="register-otp"
                  className="input-base text-center tracking-[0.6em] text-2xl font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => setTouched((prev) => ({ ...prev, code: true }))}
                  placeholder="000000"
                  inputMode="numeric"
                  required
                  pattern="\d{6}"
                  maxLength={6}
                  aria-invalid={touched.code && !otpValid}
                />
              </FormField>

              <button type="submit" disabled={loading || !otpValid} className="btn btn-primary w-full py-3 text-base">
                {loading ? <><Spinner size="sm" className="text-white" /> Đang xác thực…</> : '✓ Hoàn tất đăng ký'}
              </button>

              <button
                type="button"
                className="w-full text-center text-sm text-muted hover:text-brand-700 transition-colors"
                onClick={() => { setStep(0); setCode(''); setError(null); setInfo(null); }}
              >
                ← Quay lại
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 1</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Điền thông tin</h3>
          <p className="mt-2 text-sm text-muted">Nhập họ tên, số điện thoại, mật khẩu và chọn loại tài khoản phù hợp.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 2</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Xác thực OTP</h3>
          <p className="mt-2 text-sm text-muted">Nhập mã OTP để hoàn tất đăng ký và kích hoạt tài khoản ngay.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 3</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Bắt đầu sử dụng</h3>
          <p className="mt-2 text-sm text-muted">Đăng nhập để tìm xe, lưu xe yêu thích hoặc đăng bán xe của bạn.</p>
        </div>
      </section>
    </div>
  );
}
