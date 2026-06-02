export function formatPrice(vnd: number): string {
  if (vnd >= 1_000_000_000) {
    return `${(vnd / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ ₫`;
  }
  if (vnd >= 1_000_000) {
    return `${(vnd / 1_000_000).toFixed(0)} triệu ₫`;
  }
  return `${new Intl.NumberFormat('vi-VN').format(vnd)} ₫`;
}

export const FUEL_LABELS: Record<string, string> = {
  petrol: 'Xăng',
  diesel: 'Dầu',
  electric: 'Điện',
  hybrid: 'Hybrid',
  other: 'Khác',
};

export const TRANS_LABELS: Record<string, string> = {
  automatic: 'Tự động',
  manual: 'Số sàn',
  'semi-automatic': 'Bán tự động',
};
