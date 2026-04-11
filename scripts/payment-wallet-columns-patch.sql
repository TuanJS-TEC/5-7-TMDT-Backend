-- UC29 — Cột bổ sung cho payment_orders (chạy khi TYPEORM_SYNC=false).
-- Database: car_marketplace

ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS "walletPayUrl" varchar(2048);
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS "walletSessionExpiresAt" timestamptz;
