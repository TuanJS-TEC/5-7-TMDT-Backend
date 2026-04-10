export type PaymentMethodType =
  | 'bank_transfer'
  | 'momo'
  | 'vnpay'
  | 'zalopay'
  | 'credit_card';

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
    type: 'vnpay',
    name: 'Thanh toán qua VNPAY',
    description: 'Thanh toán quét mã QR qua ứng dụng ngân hàng hoặc ví VNPAY',
    iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/vnpay-3628795-3030232.png',
    isActive: true,
  },
  {
    type: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán một chạm qua ví điện tử MoMo',
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
    type: 'credit_card',
    name: 'Thẻ tín dụng / Thẻ ghi nợ',
    description: 'Thanh toán qua thẻ Visa, Mastercard, JCB',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
    isActive: true,
  },
];
