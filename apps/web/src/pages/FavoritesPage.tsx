import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ListingDto } from '../types/listing';
import { useToast } from '../components/ui/Toast';
import { PageEmpty, PageError, PageLoading } from '../components/ui/PageState';
import { AppIcon, PRICE_ICON } from '../components/icons';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

function formatPrice(vnd: number) {
  if (vnd >= 1_000_000_000) return (vnd / 1_000_000_000).toFixed(1).replace('.0','') + ' tỷ ₫';
  if (vnd >= 1_000_000)     return (vnd / 1_000_000).toFixed(0) + ' triệu ₫';
  return new Intl.NumberFormat('vi-VN').format(vnd) + ' ₫';
}

export function FavoritesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items,   setItems]   = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function loadFavorites(currentUserId: string) {
    try {
      setLoading(true);
      const res = await api<ListingDto[]>(`/listings/favorites?userId=${encodeURIComponent(currentUserId)}`);
      setItems(res);
      setError(null);
    } catch (e) {
      const nextError = e instanceof ApiError ? e.message : 'Không tải được danh sách yêu thích';
      setError(nextError);
      toast(nextError, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadFavorites(user.id);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-900 inline-flex items-center gap-2">
            <AppIcon name="heart" size="md" alt="" /> Xe đã lưu
          </h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {items.length > 0 ? `${items.length} xe trong danh sách yêu thích` : 'Danh sách yêu thích của bạn'}
          </p>
        </div>
        <Link to="/" className="btn btn-secondary py-1.5 px-4 text-sm">
          Khám phá thêm xe
        </Link>
      </div>

      {error && (
        <PageError message={error} onRetry={user ? () => void loadFavorites(user.id) : undefined} />
      )}

      {loading ? (
        <PageLoading label="Đang tải danh sách yêu thích..." />
      ) : items.length === 0 ? (
        <PageEmpty
          icon="heart"
          title="Chưa có xe nào"
          description='Khám phá danh sách xe và nhấn "Lưu yêu thích" trên trang chi tiết để lưu lại.'
          action={<Link to="/" className="btn btn-primary">Khám phá xe</Link>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <Link
              key={l.id}
              to={`/listings/${l.id}`}
              className="card group flex flex-col overflow-hidden"
              data-hoverable
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-50">
                <img
                  src={resolveListingImageUrl(l.imageUrls[0], l.id)}
                  alt={l.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = fallbackListingImage(l.id); }}
                />
                <span className="absolute left-2.5 top-2.5 badge bg-red-500 text-white inline-flex items-center p-1">
                  <AppIcon name="heart" size="xs" alt="" className="brightness-0 invert" />
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <p className="text-xs text-muted">{l.carMake} {l.carModel} · {l.carYear}</p>
                <h2 className="font-display font-semibold text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
                  {l.title}
                </h2>
                <p className="mt-auto inline-flex items-center gap-1.5 pt-2 font-display text-xl font-bold text-brand-700">
                  <AppIcon name={PRICE_ICON} size="xs" alt="" />
                  {formatPrice(l.priceVnd)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
