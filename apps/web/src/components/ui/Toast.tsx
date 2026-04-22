import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const colorMap: Record<ToastType, string> = {
  success: 'border-l-emerald-500 bg-white text-emerald-900',
  error:   'border-l-red-500 bg-white text-red-900',
  info:    'border-l-brand-500 bg-white text-brand-900',
  warning: 'border-l-amber-500 bg-white text-amber-900',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'bg-emerald-100 text-emerald-600',
  error:   'bg-red-100 text-red-600',
  info:    'bg-brand-100 text-brand-600',
  warning: 'bg-amber-100 text-amber-600',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border border-l-4 p-4 shadow-lg
        ${colorMap[toast.type]}
        ${toast.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${iconColorMap[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug pt-0.5">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-current opacity-40 hover:opacity-70 transition-opacity text-lg leading-none"
        aria-label="Đóng"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 320);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal-like fixed container */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end"
        style={{ maxWidth: '24rem', width: 'calc(100vw - 3rem)' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
