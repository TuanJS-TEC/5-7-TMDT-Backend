import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ListingDto, ListingListResult } from '../types/listing';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageEmpty, PageError } from '../components/ui/PageState';
import { StatusBadge } from '../components/ui/Badge';
import { AppIcon } from '../components/icons';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

function formatPrice(vnd: number): string {
  if (vnd >= 1_000_000_000) return `${(vnd / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(0)} triệu ₫`;
  return `${new Intl.NumberFormat('vi-VN').format(vnd)} ₫`;
}

export function SellerMyListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<ListingListResult>('/listings/me?page=1&limit=50');
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách tin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markSold(id: string, title: string) {
    if (!window.confirm(`Đánh dấu "${title}" là đã bán? Tin sẽ ẩn khỏi trang chủ.`)) return;
    setBusyId(id);
    try {
      await api(`/listings/${id}/mark-sold`, { method: 'PATCH' });
      toast('Đã đánh dấu tin là đã bán', 'success');
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Không đánh dấu được', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function removeListing(id: string, title: string) {
    if (!window.confirm(`Xóa tin "${title}"? Hành động này không thể hoàn tác.`)) return;
    setBusyId(id);
    try {
      await api(`/listings/${id}`, { method: 'DELETE' });
      toast('Đã xóa tin đăng', 'success');
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Không xóa được tin', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const canMarkSold = (status: string) => status === 'approved';
  const canDelete = (status: string) => !['sold', 'removed'].includes(status);
  const canEdit = (status: string) =>
    ['pending', 'draft', 'modification_requested', 'rejected', 'approved'].includes(status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-900 inline-flex items-center gap-2">
            <AppIcon name="racing" size="md" alt="" /> Tin của tôi
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý tin đăng của <strong>{user?.fullName}</strong> — đánh dấu đã bán hoặc xóa tin.
          </p>
        </div>
        <Link to="/seller/listing/new" className="btn btn-primary inline-flex items-center gap-2">
          + Đăng tin mới
        </Link>
      </div>

      {error && <PageError message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <PageEmpty
          icon="racing"
          title="Chưa có tin đăng"
          description="Hãy đăng tin bán xe đầu tiên của bạn."
          action={
            <Link to="/seller/listing/new" className="btn btn-primary mt-4">
              + Đăng tin bán xe
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-brand-100 bg-brand-50/80">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-brand-950">Xe</th>
                  <th className="px-4 py-3.5 font-semibold text-brand-950">Giá</th>
                  <th className="px-4 py-3.5 font-semibold text-brand-950">Trạng thái</th>
                  <th className="px-4 py-3.5 font-semibold text-brand-950 hidden md:table-cell">Cập nhật</th>
                  <th className="px-4 py-3.5 font-semibold text-brand-950">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-brand-50/40 transition-colors">
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
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-muted text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(row.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.status === 'modification_requested' && row.modificationRequestDetails && (
                          <p className="w-full text-xs text-amber-800 mb-1 line-clamp-2" title={row.modificationRequestDetails}>
                            Admin yêu cầu: {row.modificationRequestDetails}
                          </p>
                        )}
                        {canEdit(row.status) && (
                          <Link
                            to={`/seller/listing/${row.id}/edit`}
                            className="btn btn-primary py-1.5 px-3 text-xs"
                          >
                            {row.status === 'modification_requested' ? 'Sửa theo yêu cầu' : 'Chỉnh sửa'}
                          </Link>
                        )}
                        {row.status === 'approved' && (
                          <Link
                            to={`/seller/orders?listingId=${encodeURIComponent(row.id)}`}
                            className="btn btn-secondary py-1.5 px-3 text-xs"
                          >
                            Nâng cấp gói
                          </Link>
                        )}
                        {canMarkSold(row.status) && (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void markSold(row.id, row.title)}
                            className="btn bg-purple-600 text-white hover:bg-purple-700 py-1.5 px-3 text-xs disabled:opacity-60"
                          >
                            {busyId === row.id ? <Spinner size="sm" className="text-white" /> : 'Đã bán'}
                          </button>
                        )}
                        {canDelete(row.status) && (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void removeListing(row.id, row.title)}
                            className="btn btn-secondary border-red-200 text-red-800 hover:bg-red-50 py-1.5 px-3 text-xs disabled:opacity-60"
                          >
                            Xóa tin
                          </button>
                        )}
                      </div>
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
