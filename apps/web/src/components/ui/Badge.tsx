import { AppIcon, PACKAGE_ICON } from '../icons';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'muted' | 'gold' | 'purple';

const styles: Record<BadgeVariant, string> = {
  brand:   'bg-blue-100 text-blue-800 border border-blue-200',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  danger:  'bg-red-100 text-red-800 border border-red-200',
  muted:   'bg-gray-100 text-gray-600 border border-gray-200',
  gold:    'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border border-amber-300',
  purple:  'bg-purple-100 text-purple-800 border border-purple-200',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'brand', children, className = '', dot }: BadgeProps) {
  return (
    <span className={`badge ${styles[variant]} ${className}`}>
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger'  ? 'bg-red-500' :
          'bg-current opacity-70'
        }`} />
      )}
      {children}
    </span>
  );
}

/** Map listing status to badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    approved:  { variant: 'success', label: 'Đã duyệt' },
    pending:   { variant: 'warning', label: 'Chờ duyệt' },
    rejected:  { variant: 'danger',  label: 'Từ chối' },
    draft:     { variant: 'muted',   label: 'Nháp' },
    sold:      { variant: 'purple',  label: 'Đã bán' },
    removed:   { variant: 'muted',   label: 'Đã gỡ' },
    expired:   { variant: 'muted',   label: 'Hết hạn' },
    modification_requested: { variant: 'warning', label: 'Cần sửa' },
  };
  const cfg = map[status] ?? { variant: 'muted' as BadgeVariant, label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

/** Map package type to badge */
export function PackageBadge({ type }: { type: string }) {
  const iconName = PACKAGE_ICON[type];
  if (type === 'vip' && iconName) {
    return (
      <Badge variant="gold" className="inline-flex items-center gap-1">
        <AppIcon name={iconName} size="xs" alt="" /> VIP
      </Badge>
    );
  }
  if (type === 'premium' && iconName) {
    return (
      <Badge variant="purple" className="inline-flex items-center gap-1">
        <AppIcon name={iconName} size="xs" alt="" /> Nổi bật
      </Badge>
    );
  }
  return null;
}
