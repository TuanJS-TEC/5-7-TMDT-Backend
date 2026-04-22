import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ListingDto, ListingListResult } from '../types/listing';
import { PackageBadge } from '../components/ui/Badge';
import { PageEmpty, PageError } from '../components/ui/PageState';

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
          src={listing.imageUrls[0] ?? `https://picsum.photos/seed/${listing.id}/800/500`}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
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
        <p className="mt-auto pt-2 font-display text-xl font-bold text-brand-700">
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
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 md:p-12 text-white shadow-xl shadow-brand-800/20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-400/20 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {total > 0 ? `${total} xe đang bán` : 'Sàn xe đã kiểm duyệt'}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl leading-tight">
            Tìm chiếc xe<br />
            <span className="text-brand-200">phù hợp với bạn</span>
          </h1>
          <p className="mt-4 text-base text-white/75 max-w-lg">
            Tất cả tin đăng đã qua kiểm duyệt — thông tin minh bạch, giao dịch an toàn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50 shadow-lg">
              Đăng ký bán xe
            </Link>
            <a href="#listings" className="btn bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur-sm">
              Xem ngay
            </a>
          </div>
        </div>
      </section>

      {/* ── Filter Bar ───────────────────────────────── */}
      <section id="listings" className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
            <input
              className="input-base pl-9"
              placeholder="Tìm theo tên, hãng, dòng xe..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
          </div>
          {/* Make */}
          <select
            className="input-base"
            value={filters.make}
            onChange={(e) => setFilter('make', e.target.value)}
          >
            <option value="">Tất cả hãng</option>
            {CAR_MAKES.slice(1).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {/* Fuel */}
          <select
            className="input-base"
            value={filters.fuelType}
            onChange={(e) => setFilter('fuelType', e.target.value)}
          >
            <option value="">Nhiên liệu</option>
            {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {/* Transmission */}
          <select
            className="input-base"
            value={filters.transmission}
            onChange={(e) => setFilter('transmission', e.target.value)}
          >
            <option value="">Hộp số</option>
            {Object.entries(TRANS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {/* Min price */}
          <input
            type="number"
            className="input-base"
            placeholder="Giá từ (triệu)"
            value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', e.target.value ? String(Number(e.target.value) * 1_000_000) : '')}
            min={0}
          />
          {/* Max price */}
          <input
            type="number"
            className="input-base"
            placeholder="Đến (triệu)"
            value={filters.maxPrice ? String(Number(filters.maxPrice) / 1_000_000) : ''}
            onChange={(e) => setFilter('maxPrice', e.target.value ? String(Number(e.target.value) * 1_000_000) : '')}
            min={0}
          />
        </div>
        {/* Active filter pills */}
        {(filters.make || filters.fuelType || filters.search || filters.minPrice || filters.maxPrice) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">Đang lọc:</span>
            {filters.make     && <span className="badge bg-brand-100 text-brand-800">{filters.make} ×</span>}
            {filters.fuelType && <span className="badge bg-brand-100 text-brand-800">{FUEL_LABELS[filters.fuelType]} ×</span>}
            {filters.transmission && <span className="badge bg-brand-100 text-brand-800">{TRANS_LABELS[filters.transmission]} ×</span>}
            {filters.search       && <span className="badge bg-brand-100 text-brand-800">"{filters.search}" ×</span>}
            <button
              className="text-muted underline hover:text-ink transition-colors ml-1"
              onClick={() => { const reset: Filters = { make:'', fuelType:'', transmission:'', minPrice:'', maxPrice:'', search:'' }; setFilters(reset); fetchListings(reset); }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </section>

      {/* ── Error ────────────────────────────────────── */}
      {error && <PageError message={error} onRetry={() => void fetchListings(filters)} />}

      {/* ── Grid ─────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
          : items.map((l) => <CarCard key={l.id} listing={l} />)
        }
      </div>

      {/* ── Empty state ─────────────────────────────── */}
      {!loading && items.length === 0 && !error && (
        <PageEmpty
          icon="🚗"
          title="Chưa có xe nào"
          description={
            filters.make || filters.fuelType || filters.transmission || filters.search
              ? 'Thử thay đổi bộ lọc để tìm xe phù hợp hơn.'
              : 'Hãy đăng nhập với vai trò người bán để đăng tin, sau đó quản trị duyệt.'
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
    </div>
  );
}
