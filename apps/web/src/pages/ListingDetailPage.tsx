import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ListingDto } from '../types/listing';
import { StatusBadge, PackageBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageError } from '../components/ui/PageState';
import { AppIcon, PRICE_ICON } from '../components/icons';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

interface SellerInfo { id?: string; fullName?: string; accountType?: string; displayPhone?: string; }
type Detail = ListingDto & { seller?: SellerInfo };

const FUEL_LABELS: Record<string, string>  = { petrol:'Xăng', diesel:'Dầu', electric:'Điện', hybrid:'Hybrid', other:'Khác' };
const TRANS_LABELS: Record<string, string> = { automatic:'Tự động', manual:'Số sàn', 'semi-automatic':'Bán tự động' };

function formatPrice(vnd: number) {
  if (vnd >= 1_000_000_000) return (vnd / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ ₫';
  if (vnd >= 1_000_000)     return (vnd / 1_000_000).toFixed(0) + ' triệu ₫';
  return new Intl.NumberFormat('vi-VN').format(vnd) + ' ₫';
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing]   = useState<Detail | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox]   = useState(false);
  const [phone, setPhone]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [favMsg, setFavMsg]       = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api<Detail>(`/listings/${id}`);
        if (!cancelled) { setListing(res); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Không tải được tin đăng');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function revealPhone() {
    if (!id) return;
    try {
      const res = await api<{ phone: string }>(`/listings/${id}/phone`);
      setPhone(res.phone);
      toast('Đã hiển thị số điện thoại người bán', 'success');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không lấy được SĐT');
      toast('Không lấy được số điện thoại', 'error');
    }
  }

  async function addFavorite() {
    if (!user || !id) return;
    setFavLoading(true); setFavMsg(null);
    try {
      const res = await api<{ message: string }>(`/listings/${id}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      setFavMsg(res.message ?? 'Đã lưu vào yêu thích');
      toast('Đã thêm xe vào danh sách yêu thích', 'success');
    } catch (e) {
      setFavMsg(e instanceof ApiError ? e.message : 'Lỗi khi lưu');
      toast('Không thể lưu yêu thích', 'error');
    } finally {
      setFavLoading(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-1/3 rounded-full" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="skeleton aspect-[4/3] rounded-2xl" />
        <div className="space-y-4">
          {[
            'w-1/2',
            'w-full',
            'w-3/4',
            'w-full',
            'w-1/3',
          ].map((widthClass, index) => (
            <div key={index} className={`skeleton h-5 rounded-full ${widthClass}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !listing) return (
    <div className="space-y-4">
      <PageError message={error ?? 'Không tìm thấy tin đăng.'} />
      <Link to="/" className="btn btn-primary mt-4">← Về trang chủ</Link>
    </div>
  );

  const images = listing.imageUrls.length > 0
    ? listing.imageUrls
    : [`https://picsum.photos/seed/${listing.id}/800/600`];

  return (
    <div className="animate-fade-in space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-brand-700 transition-colors">Find a car</Link>
        <span>/</span>
        <span className="text-ink">{listing.carMake} {listing.carModel}</span>
      </nav>

      <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-brand-100/40 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Verified listing</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">{listing.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {listing.carMake} {listing.carModel} · {listing.carYear} · {new Intl.NumberFormat('vi-VN').format(listing.mileageKm)} km
            </p>
          </div>
          <div className="text-right">
            <p className="inline-flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-muted">
              <AppIcon name={PRICE_ICON} size="xs" alt="" /> Giá
            </p>
            <p className="font-display text-3xl font-bold text-brand-700">{formatPrice(listing.priceVnd)}</p>
          </div>
        </div>
      </section>

      <article className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div
            className="relative overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 cursor-zoom-in shadow-sm"
            onClick={() => setLightbox(true)}
          >
            <img
              src={resolveListingImageUrl(images[activeImg], listing.id)}
              alt={listing.title}
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-102"
              onError={(e) => { e.currentTarget.src = fallbackListingImage(listing.id); }}
            />
            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex gap-2">
              <StatusBadge status={listing.status} />
              <PackageBadge type={listing.packageType} />
            </div>
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {activeImg + 1} / {images.length}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                    i === activeImg ? 'border-brand-500 shadow-md shadow-brand-300' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveListingImageUrl(url, `${listing.id}-${i}`)}
                    alt=""
                    className="h-16 w-22 object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackListingImage(`${listing.id}-${i}`); }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="card p-5 top-24 lg:sticky">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {listing.carMake} {listing.carModel} · {listing.carYear}
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-brand-900 leading-snug">{listing.title}</h2>
            <p className="mt-3 inline-flex items-center gap-2 font-display text-3xl font-bold text-brand-700">
              <AppIcon name={PRICE_ICON} size="md" alt="" />
              {formatPrice(listing.priceVnd)}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
              {[
                { label: 'Năm SX', dd: String(listing.carYear) },
                { label: 'Số km', dd: `${new Intl.NumberFormat('vi-VN').format(listing.mileageKm)} km` },
                { label: 'Nhiên liệu', dd: FUEL_LABELS[listing.fuelType] ?? listing.fuelType },
                { label: 'Hộp số', dd: TRANS_LABELS[listing.transmission] ?? listing.transmission },
              ].map(({ label, dd }) => (
                <div key={label} className="rounded-xl bg-brand-50 px-3 py-2.5">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-semibold text-ink mt-0.5">{dd}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 border-t border-brand-100 pt-4">
              <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-2">Người bán</p>
              <p className="font-medium text-ink">
                {listing.seller?.fullName ?? '—'}
                {listing.seller?.accountType && (
                  <span className="ml-2 badge bg-purple-100 text-purple-800 text-[0.65rem]">
                    {listing.seller.accountType}
                  </span>
                )}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={revealPhone}
                className="btn btn-primary w-full py-2.5"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <AppIcon name="vipCard" size="sm" alt="" className="brightness-0 invert" />
                  {phone ?? 'Xem số điện thoại'}
                </span>
              </button>
              {user ? (
                <button
                  type="button"
                  disabled={favLoading}
                  onClick={addFavorite}
                  className="btn btn-secondary w-full py-2.5"
                >
                  {favLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name="heart" size="sm" alt="" />
                      Lưu yêu thích
                    </span>
                  )}
                </button>
              ) : (
                <Link to="/login" className="btn btn-secondary w-full py-2.5 justify-center">
                  Đăng nhập để lưu yêu thích
                </Link>
              )}
              {favMsg && (
                <p className="text-center text-sm text-brand-700 animate-slide-up">{favMsg}</p>
              )}
            </div>
          </div>
        </div>
      </article>

      <section className="card p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-3">Chi tiết xe</h2>
        <p className="whitespace-pre-wrap break-words text-muted leading-relaxed text-sm">{listing.description}</p>
      </section>

      <section className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 1</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Xem đúng xe</h3>
          <p className="mt-2 text-sm text-muted">Ảnh thực tế, thông số rõ ràng và trạng thái tin đăng minh bạch.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 2</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Liên hệ seller</h3>
          <p className="mt-2 text-sm text-muted">Mở số điện thoại trực tiếp để trao đổi nhanh về xe và lịch xem.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Step 3</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Lưu và quyết định</h3>
          <p className="mt-2 text-sm text-muted">Lưu vào yêu thích để so sánh nhiều lựa chọn trước khi chốt mua.</p>
        </div>
      </section>

      {lightbox && (
        <div className="overlay" onClick={() => setLightbox(false)}>
          <div className="relative max-w-4xl w-full animate-scale-in flex justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveListingImageUrl(images[activeImg], listing.id)}
              alt=""
              className="w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onError={(e) => { e.currentTarget.src = fallbackListingImage(listing.id); }}
            />
            <button
              className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-ink hover:bg-brand-50"
              onClick={() => setLightbox(false)}
            >✕</button>
            {images.length > 1 && (
              <>
                <button className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow" onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}>‹</button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow" onClick={() => setActiveImg(i => (i + 1) % images.length)}>›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
