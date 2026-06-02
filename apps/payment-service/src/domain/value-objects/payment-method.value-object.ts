export type PaymentMethodType =
  | 'bank_transfer'
  | 'qr_banking'
  | 'momo'
  | 'vnpay'
  | 'zalopay'
  | 'credit_card'
  /** UC30 — ATM / Internet Banking qua cổng trung gian (demo sandbox) */
  | 'atm_internet_banking';

export interface PaymentMethodInfo {
  type: PaymentMethodType;
  name: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
}

/** UC27 — Danh sách các phương thức thanh toán có sẵn */
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    type: 'atm_internet_banking',
    name: 'ATM / Internet Banking (sandbox demo)',
    description:
      'UC30 — Thanh toán qua cổng trung gian (VNPay/PayOS-style). Demo nội bộ, không kết nối ngân hàng thật.',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    isActive: true,
  },
  {
    type: 'zalopay',
    name: 'ZaloPay (sandbox demo)',
    description:
      'UC29 — Luồng ví điện tử (thử nghiệm: cổng Demo Wallet nội bộ, không gọi API ZaloPay thật).',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/vi/2/2d/ZaloPay_logo.png',
    isActive: true,
  },
  {
    type: 'vnpay',
    name: 'Thanh toán qua VNPAY',
    description: 'Thanh toán quét mã QR qua ứng dụng ngân hàng hoặc ví VNPAY',
    iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/vnpay-3628795-3030232.png',
    isActive: true,
  },
  {
    type: 'momo',
    name: 'Ví MoMo (sandbox demo)',
    description:
      'UC29 — Luồng ví điện tử (thử nghiệm: cổng Demo Wallet nội bộ, không gọi API MoMo thật).',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
    isActive: true,
  },
  {
    type: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển tiền trực tiếp vào tài khoản ngân hàng của hệ thống',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    isActive: true,
  },
  {
    type: 'qr_banking',
    name: 'QR Banking (VietQR)',
    description: 'Quét mã VietQR bằng app ngân hàng để thanh toán',
    iconUrl: '/assets/vietqr/payment-qr.png',
    isActive: true,
  },
  {
    type: 'credit_card',
    name: 'Thẻ tín dụng / Thẻ ghi nợ',
    description: 'Thanh toán qua thẻ Visa, Mastercard, JCB',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
    isActive: true,
  },
];
