import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { uploadListingImage } from '../api/uploadListingImage';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageError } from '../components/ui/PageState';
import {
  ListingImageUploader,
  type LocalListingImage,
} from '../components/ListingImageUploader';
import { AppIcon, PACKAGE_ICON, PRICE_ICON, type AppIconName } from '../components/icons';

const STEPS = ['Thông tin xe', 'Mô tả & Ảnh', 'Gói tin'];

const PACKAGES: {
  type: string;
  icon: AppIconName;
  name: string;
  price: string;
  days: number;
  features: string[];
  maxImages: number;
  recommended?: boolean;
}[] = [
  { type: 'basic', icon: PACKAGE_ICON.basic, name: 'Cơ bản', price: 'Miễn phí', days: 7, features: ['Hiển thị 7 ngày', 'Lên đến 5 ảnh', 'Vị trí thường'], maxImages: 5 },
  { type: 'premium', icon: PACKAGE_ICON.premium, name: 'Nổi bật', price: '199.000 ₫', days: 30, features: ['Hiển thị 30 ngày', 'Lên đến 15 ảnh', 'Badge Nổi bật', 'Ưu tiên tìm kiếm'], recommended: true, maxImages: 15 },
  { type: 'vip', icon: PACKAGE_ICON.vip, name: 'VIP', price: '499.000 ₫', days: 60, features: ['Hiển thị 60 ngày', 'Ảnh không giới hạn', 'Badge VIP vàng', 'Top kết quả', 'Hỗ trợ ưu tiên'], maxImages: 20 },
];

const MAX_BY_PACKAGE: Record<string, number> = {
  basic: 5,
  premium: 15,
  vip: 20,
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const done = idx < current; const active = idx === current;
        return (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${done ? 'bg-emerald-500 border-emerald-500' : active ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30' : 'border-brand-200 text-muted'}`}>
                {done ? <AppIcon name="priority" size="sm" alt="" className="brightness-0 invert" /> : idx + 1}
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

  const [carMake,       setCarMake]       = useState('Toyota');
  const [carModel,      setCarModel]      = useState('Camry');
  const [carYear,       setCarYear]       = useState(2020);
  const [mileageKm,     setMileageKm]     = useState(45_000);
  const [fuelType,      setFuelType]      = useState<'petrol'|'diesel'|'electric'|'hybrid'|'other'>('petrol');
  const [transmission,  setTransmission]  = useState<'automatic'|'manual'|'semi-automatic'>('automatic');
  const [priceVnd,      setPriceVnd]      = useState(720_000_000);

  const [title,         setTitle]         = useState('Toyota Camry 2.5Q — một chủ');
  const [description,   setDescription]   = useState('Xe zin, bảo dưỡng định kỳ, lịch sử rõ ràng. Xem xe tại Hà Nội.');
  const [localImages,   setLocalImages]   = useState<LocalListingImage[]>([]);

  const [packageType,   setPackageType]   = useState<'basic'|'premium'|'vip'>('basic');

  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [createdId,     setCreatedId]     = useState<string | null>(null);

  const maxImages = useMemo(
    () => MAX_BY_PACKAGE[packageType] ?? 5,
    [packageType],
  );

  function goToStep2() {
    if (localImages.length < 1) {
      setError('Vui lòng chọn ít nhất 1 ảnh xe (JPEG hoặc PNG).');
      toast('Cần ít nhất một ảnh', 'warning');
      return;
    }
    setError(null);
    setStep(2);
  }

  async function onSubmit() {
    if (!user) return;
    if (localImages.length < 1) {
      setError('Vui lòng chọn ít nhất 1 ảnh.');
      return;
    }
    if (localImages.length > maxImages) {
      setError(`Gói ${packageType} cho phép tối đa ${maxImages} ảnh.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          priceVnd,
          packageType,
          imageUrls: [],
          carMake,
          carModel,
          carYear,
          mileageKm,
          fuelType,
          transmission,
        }),
      });

      let uploaded = 0;
      for (const img of localImages) {
        await uploadListingImage(res.id, img.file);
        uploaded += 1;
      }

      setCreatedId(res.id);
      toast(`Đã gửi tin với ${uploaded} ảnh — chờ kiểm duyệt`, 'success');
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
        <div className="mb-4 flex justify-center">
          <AppIcon name="glitter" size="2xl" alt="" />
        </div>
        <h2 className="font-display text-2xl font-bold text-brand-900">Tin đã được gửi!</h2>
        <p className="mt-2 text-muted">Tin của bạn đang chờ quản trị viên duyệt.</p>
        <p className="mt-1 font-mono text-xs text-muted">ID: {createdId}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/" className="btn btn-primary w-full justify-center">Về trang chủ</Link>
          <button
            type="button"
            onClick={() => {
              setCreatedId(null);
              setStep(0);
              setLocalImages([]);
            }}
            className="btn btn-secondary w-full justify-center"
          >
            Đăng tin khác
          </button>
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
                  <option value="petrol">Xăng</option>
                  <option value="diesel">Dầu</option>
                  <option value="electric">Điện</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Hộp số</label>
                <select className="input-base" value={transmission} onChange={e => setTransmission(e.target.value as typeof transmission)}>
                  <option value="automatic">Tự động</option>
                  <option value="manual">Số sàn</option>
                  <option value="semi-automatic">Bán tự động</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <AppIcon name={PRICE_ICON} size="xs" alt="" /> Giá bán (VND)
              </label>
              <input type="number" className="input-base" value={priceVnd} onChange={e => setPriceVnd(Number(e.target.value))} min={0} required />
              <p className="mt-1 text-xs text-muted">≈ {(priceVnd / 1_000_000).toFixed(0)} triệu ₫</p>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary" onClick={() => setStep(1)}>Tiếp theo →</button>
            </div>
          </div>
        )}

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
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Hình ảnh</label>
              <ListingImageUploader
                images={localImages}
                onChange={setLocalImages}
                maxImages={20}
                disabled={loading}
              />
              <p className="text-xs text-muted mt-2">
                Ảnh sẽ được tải lên server sau khi bạn gửi tin (tối đa theo gói ở bước cuối).
              </p>
            </div>
            <div className="flex justify-between">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>← Quay lại</button>
              <button type="button" className="btn btn-primary" onClick={goToStep2}>Tiếp theo →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            {localImages.length > maxImages && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Bạn đã chọn {localImages.length} ảnh nhưng gói {packageType} chỉ cho phép {maxImages}. Hãy quay lại bước 2 để bớt ảnh.
              </p>
            )}
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <AppIcon name={PRICE_ICON} size="sm" alt="" /> Chọn gói tin
            </h2>
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
                  {'recommended' in pkg && pkg.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-600 text-white text-[0.65rem]">Phổ biến</span>
                  )}
                  <div className="mb-2 flex justify-center">
                    <AppIcon name={pkg.icon} size="lg" alt="" />
                  </div>
                  <div className="font-display font-bold text-ink">{pkg.name}</div>
                  <div className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-700">
                    <AppIcon name={PRICE_ICON} size="xs" alt="" />
                    {pkg.price}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{pkg.days} ngày</div>
                  <ul className="mt-3 space-y-1.5">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted">
                        <AppIcon name="priority" size="xs" alt="" className="opacity-80" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {localImages.slice(0, 6).map((img) => (
                <img
                  key={img.id}
                  src={img.previewUrl}
                  alt=""
                  className="h-12 w-16 rounded object-cover border border-brand-100"
                />
              ))}
              {localImages.length > 6 && (
                <span className="text-xs text-muted self-center">+{localImages.length - 6} ảnh</span>
              )}
            </div>
            <div className="flex justify-between">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Quay lại</button>
              <button
                type="button"
                className="btn btn-primary py-3 px-8"
                disabled={loading || localImages.length < 1 || localImages.length > maxImages}
                onClick={onSubmit}
              >
                {loading ? (
                  <><Spinner size="sm" className="text-white" /> Đang tải ảnh & gửi tin…</>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <AppIcon name="racing" size="sm" alt="" className="brightness-0 invert" />
                    Gửi tin chờ duyệt
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
