import { ICON_PATHS, type AppIconName } from './icons';

const SIZE_PX = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

export type AppIconSize = keyof typeof SIZE_PX;

export interface AppIconProps {
  name: AppIconName;
  size?: AppIconSize | number;
  className?: string;
  alt?: string;
  title?: string;
}

export function AppIcon({
  name,
  size = 'md',
  className = '',
  alt = '',
  title,
}: AppIconProps) {
  const px = typeof size === 'number' ? size : SIZE_PX[size];
  return (
    <img
      src={ICON_PATHS[name]}
      alt={alt}
      title={title}
      width={px}
      height={px}
      className={`inline-block shrink-0 object-contain ${className}`}
      draggable={false}
    />
  );
}
