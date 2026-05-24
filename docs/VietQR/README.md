# Ảnh VietQR demo

File gốc: `1779590931842.png`

## Bản sao phục vụ UI

| Vị trí | Đường dẫn |
|--------|-----------|
| Web (Vite / Nginx) | `apps/web/public/assets/vietqr/payment-qr.png` → URL `/assets/vietqr/payment-qr.png` |
| Payment-service (static) | `apps/payment-service/public/assets/vietqr/payment-qr.png` |

## Nơi hiển thị

- **SellerOrdersPage** — thẻ `VietQrPaymentCard` sau khi tạo đơn `qr_banking`
- **GET** `/api/v1/payments/demo-vietqr/orders/:orderId` — trang HTML demo UC28
- API `POST .../vietqr` và `GET .../orders/:id` trả `imageUrl` trỏ tới ảnh trên (mặc định `VIETQR_USE_DEMO_IMAGE=true`)

## Cấu hình (tùy chọn)

```env
VIETQR_USE_DEMO_IMAGE=true
VIETQR_DEMO_IMAGE_URL=/assets/vietqr/payment-qr.png
PAYMENT_SERVICE_PUBLIC_ORIGIN=http://localhost:3004
```

Đặt `VIETQR_USE_DEMO_IMAGE=false` để dùng lại CDN `api.vietqr.io` (cần `VIETQR_BANK_*`).

## Demo thanh toán thành công (dev)

1. Đăng nhập **seller** → **Tin của tôi** → bấm **Nâng cấp gói** trên tin `approved` (hoặc mở `/seller/orders?listingId=<uuid>`).
2. Chọn gói + **QR Banking (VietQR)** → **Tạo đơn & hiển thị QR**.
3. Bấm **Mô phỏng thanh toán (dev)** (hoặc mở trang QR → **Mô phỏng thanh toán thành công**).
4. Bấm **Làm mới** — trạng thái `success`; listing-service nhận `payment.listing_package.paid` và cập nhật `packageType` trên tin.

Env bắt buộc (Docker stack đã có sẵn):

```env
PAYMENT_WEBHOOK_SECRET=docker-dev-payment-webhook-secret
PAYMENT_DEMO_MODE=true
RABBITMQ_URL=amqp://...
```
