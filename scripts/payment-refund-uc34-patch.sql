-- UC34 — Bảng payment_refunds + cột refundedAt (chạy khi TYPEORM_SYNC=false).
-- Database: car_marketplace

ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS "refundedAt" timestamptz;

CREATE TABLE IF NOT EXISTS payment_refunds (
  "id" uuid PRIMARY KEY,
  "paymentOrderId" uuid NOT NULL,
  "originalTransactionId" varchar(128) NOT NULL,
  "amountVnd" int NOT NULL,
  "status" varchar(32) NOT NULL,
  "reason" text,
  "createdByAdminUserId" uuid NOT NULL,
  "gatewayRefundReference" varchar(128),
  "errorMessage" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_payment_refunds_paymentOrderId"
  ON payment_refunds ("paymentOrderId");
