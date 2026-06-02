import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ListingDto } from '../types/listing';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { PageEmpty, PageError } from '../components/ui/PageState';
import { StatusBadge } from '../components/ui/Badge';
import { AppIcon } from '../components/icons';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';

type PendingItem = ListingDto & { moderationStatus?: string };
interface PendingResult { items: PendingItem[]; total: number; page: number; limit: number; }

export function AdminModerationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items,    setItems]    = useState<PendingItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [msg,      setMsg]      = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason,   setReason]   = useState('');
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [modifyDetails, setModifyDetails] = useState('');

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await api<PendingResult>('/listings/admin/moderation/pending?page=1&limit=50');
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    if (!user) return; setMsg(null);
    try {
      await api(`/listings/admin/moderation/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ moderatorId: user.id }) });
      setMsg('Đã duyệt tin. Xe sẽ hiện trên trang chủ.');
      toast('Đã duyệt tin đăng thành công', 'success');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Duyệt thất bại');
      toast('Duyệt tin đăng thất bại', 'error');
    }
  }

  async function reject() {
    if (!user || !rejectId) return;
    if (reason.trim().length < 10) { setError('Lý do từ chối cần ít nhất 10 ký tự.'); return; }
    setError(null); setMsg(null);
    try {
      await api(`/listings/admin/moderation/${rejectId}/reject`, { method: 'PATCH', body: JSON.stringify({ moderatorId: user.id, reason: reason.trim() }) });
      setMsg('Đã từ chối tin đăng.');
      toast('Đã từ chối tin đăng', 'warning');
      setRejectId(null); setReason('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Từ chối thất bại');
      toast('Từ chối tin đăng thất bại', 'error');
    }
  }

  async function requestModification() {
    if (!user || !modifyId) return;
    const details = modifyDetails.trim();
    if (details.length < 10) {
      setError('Nội dung yêu cầu chỉnh sửa cần ít nhất 10 ký tự.');
      return;
    }
    setError(null);
    setMsg(null);
    try {
      await api(`/listings/admin/moderation/${modifyId}/request-modification`, {
        method: 'PATCH',
        body: JSON.stringify({ moderatorId: user.id, details }),
      });
      setMsg('Đã gửi yêu cầu chỉnh sửa cho người bán.');
      toast('Đã yêu cầu người bán chỉnh sửa tin', 'success');
      setModifyId(null);
      setModifyDetails('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gửi yêu cầu thất bại');
      toast('Gửi yêu cầu chỉnh sửa thất bại', 'error');
    }
  }

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const modifyCount = items.filter(i => i.status === 'modification_requested').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-amber-950 inline-flex items-center gap-2">
            <AppIcon name="priority" size="md" alt="" /> Kiểm duyệt tin đăng
          </h1>
          <p className="mt-1 text-sm text-muted">Chỉ tài khoản <strong>admin</strong> thấy trang này.</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-5 py-3 text-center min-w-[5rem]">
            <p className="font-display text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-muted">Chờ duyệt</p>
          </div>
          <div className="card px-5 py-3 text-center min-w-[5rem]">
            <p className="font-display text-2xl font-bold text-orange-700">{modifyCount}</p>
            <p className="text-xs text-muted">Chờ seller sửa</p>
          </div>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 animate-slide-down">{msg}</div>}
      {error && !rejectId && !modifyId && <PageError message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" className="text-amber-600" /></div>
      ) : items.length === 0 ? (
        <PageEmpty
          icon="factCheck"
          title="Không có tin chờ duyệt"
          description="Tất cả tin đăng đã được xử lý."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/80">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Xe</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Giá</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Trạng thái</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950 hidden sm:table-cell">Gói</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950 hidden md:table-cell">Ngày gửi</th>
                  <th className="px-4 py-3.5 font-semibold text-amber-950">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {items.map((row) => {
                  const awaitingSeller = row.status === 'modification_requested';
                  const canModerate = row.status === 'pending';
                  return (
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
                          {awaitingSeller && row.modificationRequestDetails && (
                            <p className="mt-1 text-xs text-amber-800 line-clamp-2 max-w-xs" title={row.modificationRequestDetails}>
                              Yêu cầu: {row.modificationRequestDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-brand-800">
                      {(row.priceVnd / 1_000_000).toFixed(0)}M ₫
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge ${row.packageType === 'vip' ? 'bg-amber-100 text-amber-800' : row.packageType === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                        {row.packageType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {awaitingSeller ? (
                        <p className="text-xs text-amber-800 max-w-[14rem]">
                          Đang chờ người bán chỉnh sửa và gửi lại.
                        </p>
                      ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => approve(row.id)}
                          disabled={!canModerate}
                          title={canModerate ? undefined : 'Chỉ duyệt tin đang chờ duyệt (pending)'}
                          className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="inline-flex items-center gap-1">
                            <AppIcon name="priority" size="xs" alt="" className="brightness-0 invert" />
                            Duyệt
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setModifyId(row.id); setModifyDetails(''); setError(null); }}
                          disabled={!canModerate}
                          title={canModerate ? undefined : 'Chỉ yêu cầu sửa tin đang chờ duyệt'}
                          className="btn btn-secondary border-amber-300 text-amber-900 hover:bg-amber-50 py-1.5 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Yêu cầu sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectId(row.id); setReason(''); setError(null); }}
                          disabled={!canModerate}
                          title={canModerate ? undefined : 'Chỉ từ chối tin đang chờ duyệt'}
                          className="btn btn-secondary border-red-200 text-red-800 hover:bg-red-50 py-1.5 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="overlay" onClick={() => setRejectId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-red-900">Từ chối tin đăng</h2>
            <p className="mt-1 text-sm text-muted">Nhập lý do tối thiểu 10 ký tự để thông báo người bán.</p>
            {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
            <textarea
              className="input-base mt-4 resize-none"
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ví dụ: Ảnh không rõ nguồn gốc, cần bổ sung giấy tờ xe."
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={() => { setRejectId(null); setError(null); }}>Hủy</button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => void reject()}>Xác nhận từ chối</button>
            </div>
          </div>
        </div>
      )}

      {modifyId && (
        <div className="overlay" onClick={() => setModifyId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-amber-900">Yêu cầu chỉnh sửa</h2>
            <p className="mt-1 text-sm text-muted">
              Mô tả cụ thể phần cần sửa (tối thiểu 10 ký tự). Người bán sẽ nhận thông báo và chỉnh sửa tin.
            </p>
            {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
            <textarea
              className="input-base mt-4 resize-none"
              rows={5}
              value={modifyDetails}
              onChange={e => setModifyDetails(e.target.value)}
              placeholder="Ví dụ: Cần bổ sung ảnh nội thất, cập nhật số km cho khớp giấy tờ."
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={() => { setModifyId(null); setError(null); }}>Hủy</button>
              <button className="btn btn-primary" onClick={() => void requestModification()}>Gửi yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
