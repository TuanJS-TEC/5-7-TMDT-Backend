/** Bộ icon tùy chỉnh — file gốc: `/icon` tại thư mục gốc repo */
export const ICON_PATHS = {
  racing: '/assets/icons/racing.png',
  layers: '/assets/icons/layers.png',
  glitter: '/assets/icons/glitter.png',
  vipCard: '/assets/icons/vip-card.png',
  priority: '/assets/icons/priority.png',
  heart: '/assets/icons/heart.png',
  priceTag: '/assets/icons/price-tag.png',
  profile: '/assets/icons/profile.png',
  dashboard: '/assets/icons/dashboard.png',
  carDealer: '/assets/icons/car-dealer.png',
  factCheck: '/assets/icons/fact-check.png',
  information: '/assets/icons/information.png',
  browserError: '/assets/icons/browser-error.png',
} as const;

export type AppIconName = keyof typeof ICON_PATHS;

/** Giá bán / lọc giá / thanh toán gói */
export const PRICE_ICON = 'priceTag' as const satisfies AppIconName;

/** Gói tin đăng */
export const PACKAGE_ICON: Record<string, AppIconName> = {
  basic: 'layers',
  premium: 'glitter',
  vip: 'vipCard',
};

/** Toast / trạng thái */
export const TOAST_ICON: Record<string, AppIconName> = {
  success: 'priority',
  error: 'browserError',
  info: 'information',
  warning: 'glitter',
};
