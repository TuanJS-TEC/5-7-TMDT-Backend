interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 16, md: 24, lg: 36 };

export function Spinner({ size = 'md', className = '', label = 'Đang tải...' }: SpinnerProps) {
  const s = sizes[size];
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${className}`}
      style={{ width: s, height: s }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{ width: s, height: s }}
        className="animate-spin-slow"
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeOpacity="0.15"
        />
        <path
          d="M12 2 A10 10 0 0 1 22 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Full-page loading overlay */
export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-brand-500" />
        <p className="text-sm text-muted">Đang tải dữ liệu…</p>
      </div>
    </div>
  );
}
