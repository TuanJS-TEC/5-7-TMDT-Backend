export const SELLER_WARNING_TYPES = [
  'misleading_info',
  'minor_policy',
  'spam_behavior',
  'inappropriate_content',
  'other',
] as const;

export type SellerWarningType = (typeof SELLER_WARNING_TYPES)[number];

export const SELLER_WARNING_TYPE_LABELS: Record<SellerWarningType, string> = {
  misleading_info: 'Thông tin gây hiểu nhầm',
  minor_policy: 'Vi phạm nhẹ điều khoản',
  spam_behavior: 'Hành vi spam / làm phiền',
  inappropriate_content: 'Nội dung không phù hợp',
  other: 'Khác',
};
