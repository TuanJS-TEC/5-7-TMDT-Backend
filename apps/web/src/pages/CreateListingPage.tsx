import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageError } from '../components/ui/PageState';

const DEMO_IMG = (i: number) => `https://picsum.photos/seed/car${i}/800/600`;

const STEPS = ['Thông tin xe', 'Mô tả & Ảnh', 'Gói tin'];

const PACKAGES = [
  { type: 'basic',   icon: '📄', name: 'Cơ bản',     price: 'Miễn phí', days: 7,  features: ['Hiển thị 7 ngày', 'Lên đến 5 ảnh', 'Vị trí thường'] },
  { type: 'premium', icon: '💎', name: 'Nổi bật',    price: '199.000 ₫', days: 30, features: ['Hiển thị 30 ngày', 'Lên đến 15 ảnh', 'Badge Nổi bật', 'Ưu tiên tìm kiếm'], recommended: true },
  { type: 'vip',     icon: '⭐', name: 'VIP',         price: '499.000 ₫', days: 60, features: ['Hiển thị 60 ngày', 'Ảnh không giới hạn', 'Badge VIP vàng', 'Top kết quả', 'Hỗ trợ ưu tiên'] },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const done = idx < current; const active = idx === current;
        return (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30' : 'border-brand-200 text-muted'}`}>
                {done ? '✓' : idx + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-brand-700' : done ? 'text-emerald-600' : 'text-muted'}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? 'bg-emerald-400' : 'bg-brand-100'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function CreateListingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 0 fields
  const [carMake,       setCarMake]       = useState('Toyota');
  const [carModel,      setCarModel]      = useState('Camry');
  const [carYear,       setCarYear]       = useState(2020);
  const [mileageKm,     setMileageKm]     = useState(45_000);
  const [fuelType,      setFuelType]      = useState<'petrol'|'diesel'|'electric'|'hybrid'|'other'>('petrol');
  const [transmission,  setTransmission]  = useState<'automatic'|'manual'|'semi-automatic'>('automatic');
  const [priceVnd,      setPriceVnd]      = useState(720_000_000);

  // Step 1 fields
  const [title,         setTitle]         = useState('Toyota Camry 2.5Q — một chủ');
  const [description,   setDescription]   = useState('Xe zin, bảo dưỡng định kỳ, lịch sử rõ ràng. Xem xe tại Hà Nội.');

  // Step 2 fields
  const [packageType,   setPackageType]   = useState<'basic'|'premium'|'vip'>('basic');

  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [createdId,     setCreatedId]     = useState<string | null>(null);

  async function onSubmit() {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const res = await api<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title, description, priceVnd, sellerId: user.id, packageType,
          imageUrls: [DEMO_IMG(1), DEMO_IMG(2), DEMO_IMG(3)],
          carMake, carModel, carYear, mileageKm, fuelType, transmission,
        }),
      });
      setCreatedId(res.id);
      toast('Đã gửi tin đăng chờ kiểm duyệt', 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được tin');
      toast('Không thể tạo tin đăng', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (createdId) return (
    <div className="mx-auto max-w-lg py-12 text-center animate-scale-in">
      <div className="card p-10">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold text-brand-900">Tin đã được gửi!</h2>
        <p className="mt-2 text-muted">Tin của bạn đang chờ quản trị viên duyệt.</p>
        <p className="mt-1 font-mono text-xs text-muted">ID: {createdId}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/" className="btn btn-primary w-full justify-center">Về trang chủ</Link>
          <button onClick={() => { setCreatedId(null); setStep(0); }} className="btn btn-secondary w-full justify-center">Đăng tin khác</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Đăng tin bán xe</h1>
        <p className="mt-1 text-sm text-muted">Tin sẽ ở trạng thái <strong>chờ duyệt</strong> sau khi gửi.</p>
      </div>

      <div className="card p-6 md:p-8">
        <StepIndicator current={step} />

        {error && (
          <div className="mb-6 animate-slide-down">
            <PageError message={error} />
          </div>
        )}

        {/* ── Step 0: Car info ── */}
        {step === 0 && (
          <div className="space-y-5 animate-slide-up">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Hãng xe</label>
                <input className="input-base" value={carMake} onChange={e => setCarMake(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Dòng xe</label>
                <input className="input-base" value={carModel} onChange={e => setCarModel(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Năm sản xuất</label>
                <input type="number" className="input-base" value={carYear} onChange={e => setCarYear(Number(e.target.value))} min={1990} max={new Date().getFullYear()} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Số km đã đi</label>
                <input type="number" className="input-base" value={mileageKm} onChange={e => setMileageKm(Number(e.target.value))} min={0} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Nhiên liệu</label>
                <select className="input-base" value={fuelType} onChange={e => setFuelType(e.target.value as typeof fuelType)}>
                  <option value="petrol">⛽ Xăng</option>
                  <option value="diesel">🛢 Dầu</option>
                  <option value="electric">⚡ Điện</option>
                  <option value="hybrid">🔋 Hybrid</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Hộp số</label>
                <select className="input-base" value={transmission} onChange={e => setTransmission(e.target.value as typeof transmission)}>
                  <option value="automatic">⚙ Tự động</option>
                  <option value="manual">🔧 Số sàn</option>
                  <option value="semi-automatic">Bán tự động</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Giá bán (VND)</label>
              <input type="number" className="input-base" value={priceVnd} onChange={e => setPriceVnd(Number(e.target.value))} min={0} required />
              <p className="mt-1 text-xs text-muted">≈ {(priceVnd / 1_000_000).toFixed(0)} triệu ₫</p>
            </div>
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={() => setStep(1)}>Tiếp theo →</button>
            </div>
          </div>
        )}

        {/* ── Step 1: Description & Images ── */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Tiêu đề tin đăng</label>
              <input className="input-base" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả chi tiết</label>
              <textarea className="input-base resize-none" rows={5} value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            {/* Image placeholder */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Hình ảnh</label>
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-8 text-center">
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm text-muted">Demo dùng ảnh placeholder (picsum.photos)</p>
                <p className="text-xs text-muted mt-1">Production: kéo thả hoặc chọn file từ máy</p>
                <div className="mt-4 flex justify-center gap-2">
                  {[1,2,3].map(i => <img key={i} src={DEMO_IMG(i)} alt="" className="h-14 w-20 rounded-lg object-cover shadow-sm" />)}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Quay lại</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Tiếp theo →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Package selection ── */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <div className="grid gap-4 sm:grid-cols-3">
              {PACKAGES.map(pkg => (
                <button
                  key={pkg.type}
                  type="button"
                  onClick={() => setPackageType(pkg.type as typeof packageType)}
                  className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                    packageType === pkg.type
                      ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-200'
                      : 'border-brand-100 hover:border-brand-300'
                  }`}
                >
                  {pkg.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-600 text-white text-[0.65rem]">Phổ biến</span>
                  )}
                  <div className="text-2xl mb-2">{pkg.icon}</div>
                  <div className="font-display font-bold text-ink">{pkg.name}</div>
                  <div className="text-brand-700 font-semibold mt-1">{pkg.price}</div>
                  <div className="text-xs text-muted mt-0.5">{pkg.days} ngày</div>
                  <ul className="mt-3 space-y-1.5">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="text-emerald-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Quay lại</button>
              <button className="btn btn-primary py-3 px-8" disabled={loading} onClick={onSubmit}>
                {loading ? <><Spinner size="sm" className="text-white" /> Đang gửi…</> : '🚀 Gửi tin chờ duyệt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
