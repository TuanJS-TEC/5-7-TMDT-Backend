import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { Spinner } from '../components/ui/Spinner';
import { PageEmpty, PageError } from '../components/ui/PageState';
import { useToast } from '../components/ui/Toast';
import { AppIcon } from '../components/icons';

interface CarMake {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  showOnHome: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CarMakesResult {
  items: CarMake[];
}

export function AdminCarMakesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CarMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sortOrder: 100,
    isActive: true,
    showOnHome: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<CarMakesResult>('/listings/admin/car-makes');
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách hãng xe');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCarMake(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Tên hãng xe là bắt buộc.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/listings/admin/car-makes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug: form.slug.trim() || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
          showOnHome: form.showOnHome,
        }),
      });
      toast('Đã thêm hãng xe mới', 'success');
      setForm({ name: '', slug: '', sortOrder: 100, isActive: true, showOnHome: true });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Thêm hãng xe thất bại');
      toast('Thêm hãng xe thất bại', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function patchCarMake(id: string, payload: Record<string, unknown>) {
    setError(null);
    try {
      await api(`/listings/admin/car-makes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cập nhật thất bại');
      toast('Cập nhật hãng xe thất bại', 'error');
    }
  }

  async function removeCarMake(id: string) {
    setError(null);
    try {
      await api(`/listings/admin/car-makes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      toast('Đã xóa hãng xe', 'warning');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xóa hãng xe thất bại');
      toast('Xóa hãng xe thất bại', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" className="text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-amber-950 inline-flex items-center gap-2">
          <AppIcon name="carDealer" size="md" alt="" /> Quản lý hãng xe
        </h1>
        <p className="mt-1 text-sm text-muted">Trang này chỉ dành cho tài khoản admin.</p>
      </div>

      <form onSubmit={createCarMake} className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink">Thêm hãng xe mới</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Tên hãng</label>
            <input
              className="input-base"
              value={form.name}
              onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))}
              placeholder="Ví dụ: Lexus"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Slug (tuỳ chọn)</label>
            <input
              className="input-base"
              value={form.slug}
              onChange={(e) => setForm((x) => ({ ...x, slug: e.target.value }))}
              placeholder="lexus"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Thứ tự hiển thị</label>
            <input
              type="number"
              min={0}
              className="input-base"
              value={form.sortOrder}
              onChange={(e) => setForm((x) => ({ ...x, sortOrder: Number(e.target.value || 0) }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((x) => ({ ...x, isActive: e.target.checked }))}
            />
            Hoạt động
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showOnHome}
              onChange={(e) => setForm((x) => ({ ...x, showOnHome: e.target.checked }))}
            />
            Hiển thị trang chủ
          </label>
        </div>
        <div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Đang lưu...' : 'Thêm hãng xe'}
          </button>
        </div>
      </form>

      {error && <PageError message={error} onRetry={() => void load()} />}

      {items.length === 0 ? (
        <PageEmpty
          icon="carDealer"
          title="Chưa có hãng xe nào"
          description="Hãy thêm hãng xe đầu tiên để hiển thị trên trang chủ."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-amber-950">Tên hãng</th>
                  <th className="px-4 py-3 font-semibold text-amber-950">Slug</th>
                  <th className="px-4 py-3 font-semibold text-amber-950">Sort</th>
                  <th className="px-4 py-3 font-semibold text-amber-950">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-amber-950">Trang chủ</th>
                  <th className="px-4 py-3 font-semibold text-amber-950">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{row.name}</td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">{row.slug}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className="input-base w-24"
                        defaultValue={row.sortOrder}
                        onBlur={(e) => {
                          const next = Number(e.target.value || 0);
                          if (next !== row.sortOrder) {
                            void patchCarMake(row.id, { sortOrder: next });
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) => void patchCarMake(row.id, { isActive: e.target.checked })}
                        />
                        <span>{row.isActive ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.showOnHome}
                          onChange={(e) => void patchCarMake(row.id, { showOnHome: e.target.checked })}
                        />
                        <span>{row.showOnHome ? 'Hiện' : 'Ẩn'}</span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="btn btn-secondary border-red-200 text-red-800 hover:bg-red-50 py-1.5 px-3 text-xs"
                        onClick={() => void removeCarMake(row.id)}
                      >
                        Xóa
                      </button>
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
