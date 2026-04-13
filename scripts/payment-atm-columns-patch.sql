-- UC30 — Cột bổ sung cho payment_orders (khi TYPEORM_SYNC=false).

ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS "atmPayUrl" varchar(2048);
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS "atmSessionExpiresAt" timestamptz;
