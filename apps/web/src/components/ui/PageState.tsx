import type { ReactNode } from 'react';
import { Spinner } from './Spinner';

export function PageLoading({
  label = 'Đang tải dữ liệu...',
  className = 'py-16',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-brand-500" label={label} />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>⚠ {message}</span>
      {onRetry && (
        <button type="button" className="btn btn-secondary px-3 py-1.5 text-xs" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export function PageEmpty({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-white/50 py-20 text-center">
      <div className="mb-4 text-6xl">{icon}</div>
      <h3 className="font-display text-xl font-semibold text-brand-900">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
