import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ListingDto, ListingListResult } from '../types/listing';
import { AppIcon, PRICE_ICON } from '../components/icons';
import { PackageBadge } from '../components/ui/Badge';
import { PageEmpty, PageError } from '../components/ui/PageState';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

function formatPrice(vnd: number) {
  if (vnd >= 1_000_000_000) return (vnd / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ ₫';
  if (vnd >= 1_000_000)     return (vnd / 1_000_000).toFixed(0) + ' triệu ₫';
  return new Intl.NumberFormat('vi-VN').format(vnd) + ' ₫';
}

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Xăng', diesel: 'Dầu', electric: 'Điện', hybrid: 'Hybrid', other: 'Khác',
};

const TRANS_LABELS: Record<string, string> = {
  automatic: 'Tự động', manual: 'Số sàn', 'semi-automatic': 'Bán tự động',
};

const CAR_MAKES = ['', 'Toyota', 'Honda', 'Mazda', 'Hyundai', 'Kia', 'Ford', 'VinFast', 'Mercedes', 'BMW'];
const TRENDING_TAGS = ['EVs', 'SUV', 'Sedan', 'Hybrid', 'Under 700M', 'Family Car'];

interface Filters {
  make: string;
  fuelType: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  search: string;
}

function CarCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/10]" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-5 w-4/5 rounded-full" />
        <div className="skeleton h-4 w-1/2 rounded-full" />
        <div className="skeleton h-6 w-2/5 rounded-full mt-3" />
      </div>
    </div>
  );
}

function CarCard({ listing }: { listing: ListingDto }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="card group flex flex-col overflow-hidden animate-fade-in"
      data-hoverable
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-50">
        <img
          src={resolveListingImageUrl(listing.imageUrls[0], listing.id)}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = fallbackListingImage(listing.id); }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Badges top-right */}
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
          <PackageBadge type={listing.packageType} />
        </div>
        {/* Make/model chip */}
        <div className="absolute left-2.5 top-2.5">
          <span className="badge bg-white/90 text-ink shadow-sm text-[0.7rem]">
            {listing.carMake} {listing.carModel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h2 className="line-clamp-2 font-display text-[1rem] font-semibold leading-snug text-brand-900 group-hover:text-brand-600 transition-colors">
          {listing.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{listing.carYear}</span>
          <span>·</span>
          <span>{new Intl.NumberFormat('vi-VN').format(listing.mileageKm)} km</span>
          <span>·</span>
          <span>{FUEL_LABELS[listing.fuelType] ?? listing.fuelType}</span>
          <span>·</span>
          <span>{TRANS_LABELS[listing.transmission] ?? listing.transmission}</span>
        </div>
        <p className="mt-auto inline-flex items-center gap-1.5 pt-2 font-display text-xl font-bold text-brand-700">
          <AppIcon name={PRICE_ICON} size="xs" alt="" />
          {formatPrice(listing.priceVnd)}
        </p>
      </div>
    </Link>
  );
}

export function HomePage() {
  const [items, setItems] = useState<ListingDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    make: '', fuelType: '', transmission: '', minPrice: '', maxPrice: '', search: '',
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildQuery(f: Filters) {
    const params = new URLSearchParams({ page: '1', limit: '12', status: 'approved' });
    if (f.make)         params.set('make', f.make);
    if (f.fuelType)     params.set('fuelType', f.fuelType);
    if (f.transmission) params.set('transmission', f.transmission);
    if (f.minPrice)     params.set('minPrice', f.minPrice);
    if (f.maxPrice)     params.set('maxPrice', f.maxPrice);
    if (f.search)       params.set('search', f.search);
    return '/listings?' + params.toString();
  }

  async function fetchListings(f: Filters) {
    try {
      setLoading(true);
      const res = await api<ListingListResult>(buildQuery(f));
      setItems(res.items);
      setTotal(res.total);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchListings(filters); }, []);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === 'search') {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => fetchListings(next), 450);
    } else {
      void fetchListings(next);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50 to-brand-100/70 p-6 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              NỀN TẢNG CHO MUA BÁN XE
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
              Tim xe phu hop
              <span className="block text-brand-700">cho nhu cau cua ban</span>
            </h1>
            <p className="max-w-2xl text-base text-muted md:text-lg">
              INSPIRED BY CARWOW, BUT BETTER.
            </p>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand-400 hover:text-brand-700"
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-brand-100 bg-white p-3">
                <p className="text-xs text-muted">ĐÁNH GIÁ</p>
                <p className="font-display text-lg font-bold text-ink">Excellent</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-3">
                <p className="text-xs text-muted">NGƯỜI BÁN</p>
                <p className="font-display text-lg font-bold text-ink">Da xac minh</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-3">
                <p className="text-xs text-muted">THANH TOÁN</p>
                <p className="font-display text-lg font-bold text-ink">BẢO MẬT VÀ AN TOÀN</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-200 bg-white p-4 shadow-sm md:p-6">
            <h2 className="font-display text-xl font-bold text-ink">TÌM XE NGAY</h2>
            <p className="mt-1 text-sm text-muted">NHẬP VÀ TÌM KIẾM</p>
            <div className="mt-4 space-y-3">
              <input
                className="input-base"
                placeholder="Toyota, Mazda CX-5, sedan..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
              <select
                className="input-base"
                value={filters.make}
                onChange={(e) => setFilter('make', e.target.value)}
              >
                <option value="">Chon hang xe</option>
                {CAR_MAKES.slice(1).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Xem xe dang ban
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">THƯƠNG HIỆU ĐƯỢC TÌM NHIỀU</h2>
        <div className="flex flex-wrap gap-3">
          {CAR_MAKES.slice(1).map((m) => (
            <button
              key={m}
              className={`px-5 py-3 rounded-xl border font-semibold transition-all ${
                filters.make === m 
                  ? 'bg-brand-600 border-brand-600 text-white shadow-md' 
                  : 'bg-white border-brand-100 text-ink hover:border-brand-300 hover:shadow-sm'
              }`}
              onClick={() => setFilter('make', filters.make === m ? '' : m)}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section id="listings" className="card space-y-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">BỘ LỌC NÂNG CAO</h3>
          <p className="text-sm text-muted">{total} Kết quả</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
        <select
          className="input-base w-auto min-w-[140px] bg-white"
          value={filters.fuelType}
          onChange={(e) => setFilter('fuelType', e.target.value)}
        >
          <option value="">Nhien lieu</option>
          {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className="input-base w-auto min-w-[140px] bg-white"
          value={filters.transmission}
          onChange={(e) => setFilter('transmission', e.target.value)}
        >
          <option value="">Hop so</option>
          {Object.entries(TRANS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <AppIcon name={PRICE_ICON} size="sm" alt="" className="shrink-0" />
          <input
            type="number"
            className="input-base w-32 bg-white"
            placeholder="Gia tu (tr)"
            value={filters.minPrice ? String(Number(filters.minPrice) / 1_000_000) : ''}
            onChange={(e) => setFilter('minPrice', e.target.value ? String(Number(e.target.value) * 1_000_000) : '')}
            min={0}
          />
          <span className="text-muted">-</span>
          <input
            type="number"
            className="input-base w-32 bg-white"
            placeholder="Gia den (tr)"
            value={filters.maxPrice ? String(Number(filters.maxPrice) / 1_000_000) : ''}
            onChange={(e) => setFilter('maxPrice', e.target.value ? String(Number(e.target.value) * 1_000_000) : '')}
            min={0}
          />
        </div>

        {(filters.make || filters.fuelType || filters.search || filters.minPrice || filters.maxPrice || filters.transmission) && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <button
              className="text-brand-600 font-semibold hover:underline"
              onClick={() => { const reset: Filters = { make:'', fuelType:'', transmission:'', minPrice:'', maxPrice:'', search:'' }; setFilters(reset); fetchListings(reset); }}
            >
              Xoa tat ca
            </button>
          </div>
        )}
        </div>
      </section>

      {error && <PageError message={error} onRetry={() => void fetchListings(filters)} />}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Xe đang được quan tâm</h2>
          <Link to="/" className="text-sm font-semibold text-brand-700 hover:underline">Xem tất cả</Link>
        </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
          : items.map((l) => <CarCard key={l.id} listing={l} />)
        }
      </div>
      </section>

      {!loading && items.length === 0 && !error && (
        <PageEmpty
          icon="racing"
          title="Chua tim thay xe phu hop"
          description={
            filters.make || filters.fuelType || filters.transmission || filters.search
              ? 'Hay thay doi bo loc de tim ket qua phu hop hon.'
              : 'Dang nhap vai tro nguoi ban de dang tin, sau do quan tri duyet.'
          }
          action={(
            filters.make || filters.fuelType || filters.transmission || filters.search
          ) ? (
            <button
              className="btn btn-secondary"
              onClick={() => { const reset: Filters = { make:'', fuelType:'', transmission:'', minPrice:'', maxPrice:'', search:'' }; setFilters(reset); fetchListings(reset); }}
            >
              Xóa bộ lọc
            </button>
          ) : undefined}
        />
      )}

    <section className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 md:grid-cols-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Bước 1</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">Tìm xe và so sánh</h3>
        <p className="mt-2 text-sm text-muted">
          Tra cứu nhanh theo hãng xe, giá, hộp số, nhiên liệu và tình trạng gói đăng tin.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Bước 2</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">Liên hệ người bán</h3>
        <p className="mt-2 text-sm text-muted">
          Thông tin listing minh bạch, dễ dàng liên lạc và theo dõi đơn thanh toán.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Bước 3</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">Chốt giao dịch an toàn</h3>
        <p className="mt-2 text-sm text-muted">
          Hệ thống phân quyền và kiểm duyệt giúp giảm rủi ro trong toàn bộ quy trình.
        </p>
      </div>
    </section>
    </div>
  );
}
