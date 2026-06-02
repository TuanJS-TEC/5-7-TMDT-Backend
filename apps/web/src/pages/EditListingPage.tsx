import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ListingDto } from '../types/listing';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageError } from '../components/ui/PageState';
import { AppIcon } from '../components/icons';

const EDITABLE_STATUSES = new Set([
  'pending',
  'draft',
  'modification_requested',
  'rejected',
  'approved',
]);

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceVnd, setPriceVnd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await api<ListingDto>(`/listings/me/${id}`);
        if (cancelled) return;
        if (!EDITABLE_STATUSES.has(row.status)) {
          setError(`Tin đang ở trạng thái "${row.status}" — không thể chỉnh sửa.`);
          setListing(row);
          return;
        }
        setListing(row);
        setTitle(row.title);
        setDescription(row.description);
        setPriceVnd(row.priceVnd);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Không tải được tin đăng');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !listing) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description, priceVnd }),
      });
      const wasModification = listing.status === 'modification_requested';
      toast(
        wasModification
          ? 'Đã cập nhật tin — gửi lại chờ kiểm duyệt'
          : 'Đã cập nhật tin đăng',
        'success',
      );
      navigate('/seller/listings');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không lưu được thay đổi');
      toast('Lưu tin thất bại', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <PageError
        message={error ?? 'Không tìm thấy tin đăng'}
        onRetry={() => navigate(0)}
      />
    );
  }

  const canEdit = EDITABLE_STATUSES.has(listing.status);
  const modDetails = listing.modificationRequestDetails?.trim();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <Link to="/seller/listings" className="text-sm text-brand-700 hover:underline">
          ← Tin của tôi
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-900 inline-flex items-center gap-2">
          <AppIcon name="racing" size="md" alt="" /> Chỉnh sửa tin đăng
        </h1>
        <p className="mt-1 text-sm text-muted">
          {listing.carMake} {listing.carModel} · {listing.carYear}
        </p>
      </div>

      {listing.status === 'modification_requested' && modDetails && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-semibold inline-flex items-center gap-2">
            <AppIcon name="priority" size="sm" alt="" />
            Quản trị viên yêu cầu bạn chỉnh sửa
          </p>
          {listing.modificationRequestedAt && (
            <p className="mt-1 text-xs text-amber-800">
              {new Date(listing.modificationRequestedAt).toLocaleString('vi-VN')}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap">{modDetails}</p>
          <p className="mt-3 text-xs text-amber-800">
            Sau khi lưu, tin sẽ chuyển về <strong>chờ duyệt</strong> để admin xem lại.
          </p>
        </div>
      )}

      {error && !canEdit && (
        <PageError message={error} />
      )}

      {canEdit && (
        <form className="card p-6 md:p-8 space-y-5" onSubmit={e => void onSubmit(e)}>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Tiêu đề</label>
            <input
              className="input-base"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Mô tả</label>
            <textarea
              className="input-base resize-none"
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Giá bán (VND)</label>
            <input
              type="number"
              className="input-base"
              value={priceVnd}
              onChange={e => setPriceVnd(Number(e.target.value))}
              min={0}
              required
            />
            <p className="mt-1 text-xs text-muted">
              ≈ {(priceVnd / 1_000_000).toFixed(0)} triệu ₫
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link to="/seller/listings" className="btn btn-ghost">Hủy</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><Spinner size="sm" className="text-white" /> Đang lưu…</>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
