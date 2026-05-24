import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { ListingDto, ListingListResult } from '../types/listing';
import { Spinner } from '../components/ui/Spinner';
import { PageEmpty, PageError } from '../components/ui/PageState';
import { StatusBadge } from '../components/ui/Badge';
import { AppIcon } from '../components/icons';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

function formatPrice(vnd: number): string {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(0)} triệu ₫`;
  return `${new Intl.NumberFormat('vi-VN').format(vnd)} ₫`;
}

export function AdminSoldListingsPage() {
  const [items, setItems] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<ListingListResult>('/listings/admin/sold?page=1&limit=50');
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-amber-950 inline-flex items-center gap-2">
            <AppIcon name="racing" size="md" alt="" /> Tin đã bán
          </h1>
          <p className="mt-1 text-sm text-muted">
            Danh sách xe showroom đã đánh dấu bán thành công (UC25).
          </p>
        </div>
        <div className="card px-5 py-3 text-center min-w-[5rem]">
          <p className="font-display text-2xl font-bold text-purple-700">{items.length}</p>
          <p className="text-xs text-muted">Đã bán</p>
        </div>
      </div>

      {error && <PageError message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" className="text-amber-600" />
        </div>
      ) : items.length === 0 ? (
        <PageEmpty
          icon="racing"
          title="Chưa có tin đã bán"
          description="Khi showroom đánh dấu bán xe, tin sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/80">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Xe</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Giá</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Showroom</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950 hidden md:table-cell">Ngày bán</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveListingImageUrl(row.imageUrls[0], row.id)}
                          alt=""
                          className="h-12 w-16 rounded-lg object-cover shrink-0 hidden sm:block"
                          onError={(e) => { e.currentTarget.src = fallbackListingImage(row.id); }}
                        />
                        <div>
                          <div className="font-semibold text-ink line-clamp-1">{row.title}</div>
                          <div className="text-xs text-muted">{row.carMake} {row.carModel} · {row.carYear}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-brand-800">
                      {formatPrice(row.priceVnd)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate" title={row.sellerId}>
                      {row.sellerId}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(row.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
