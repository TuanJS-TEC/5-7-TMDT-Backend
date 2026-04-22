-- Schema payment-service — chạy trên database car_marketplace khi TYPEORM_SYNC=false.
-- psql:  psql -h localhost -U postgres -d car_marketplace -f scripts/payment-schema.sql
-- Docker: docker exec -i <postgres_container> psql -U postgres -d car_marketplace < scripts/payment-schema.sql

CREATE TABLE IF NOT EXISTS payment_orders (
  "id" uuid PRIMARY KEY,
  "userId" uuid NOT NULL,
  "listingPackageType" varchar(64) NOT NULL,
  "listingId" uuid,
  "paymentMethod" varchar(32) NOT NULL,
  "amountVnd" int NOT NULL,
  "status" varchar(32) NOT NULL,
  "transactionId" varchar(128),
  "errorMessage" text,
  "vietQrImageUrl" text,
  "vietQrGeneratedAt" timestamptz,
  "vietQrExpiresAt" timestamptz,
  "transferContent" varchar(512),
  "walletPayUrl" varchar(2048),
  "walletSessionExpiresAt" timestamptz,
  "atmPayUrl" varchar(2048),
  "atmSessionExpiresAt" timestamptz,
  "refundedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_payment_orders_userId"
  ON payment_orders ("userId");
CREATE INDEX IF NOT EXISTS "IDX_payment_orders_status_paymentMethod"
  ON payment_orders ("status", "paymentMethod");

CREATE TABLE IF NOT EXISTS payment_refunds (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
