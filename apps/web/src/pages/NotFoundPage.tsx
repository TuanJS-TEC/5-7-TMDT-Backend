import { Link, useNavigate } from 'react-router-dom';
import { AppIcon } from '../components/icons';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col items-center justify-center text-center animate-fade-in">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <span className="font-display text-[8rem] font-black leading-none text-brand-100 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <AppIcon name="browserError" size="2xl" alt="" className="animate-bounce-soft" />
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold text-brand-900">Trang không tồn tại</h1>
      <p className="mt-3 text-muted max-w-sm">
        Trang bạn đang tìm kiếm đã bị xóa hoặc chưa bao giờ tồn tại.
        Hãy quay về trang chủ để tiếp tục khám phá xe.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          ← Quay lại
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Về trang chủ
        </button>
      </div>
      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-muted">
        Gợi ý: dùng menu để tới các trang <Link to="/favorites" className="font-semibold text-brand-700 hover:underline">Yêu thích</Link> hoặc <Link to="/login" className="font-semibold text-brand-700 hover:underline">Đăng nhập</Link>.
      </div>
    </div>
  );
}
