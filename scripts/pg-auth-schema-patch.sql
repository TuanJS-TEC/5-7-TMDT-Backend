-- Chạy trong DataGrip / psql trên database car_marketplace.
-- Dùng khi TYPEORM_SYNC=false và app auth-service cần cột/bảng mới.
-- KHÔNG drop/đổi cột id hay PK — tránh lỗi "cannot drop constraint users_pkey ... other objects depend on it".

-- --- 1) Bảng users: chỉ THÊM cột nếu chưa có (bỏ comment dòng đã tồn tại) ---
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fullName" varchar(200) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "accountType" varchar(32) NOT NULL DEFAULT 'personal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "freeListingCredits" int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "role" varchar(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneVerified" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "adminLocked" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "adminLockReason" varchar(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "failedLoginAttempts" int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginLockedUntil" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginUserAgent" varchar(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "address" varchar(500) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "sellerDescription" text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" varchar(1024);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "displayPhone" varchar(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

-- Nếu lỗi kiểu "column already exists" với tên khác (snake_case), xem:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';

-- --- 2) OTP + pending đăng ký (auth-service) ---
CREATE TABLE IF NOT EXISTS "otp_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(16) NOT NULL,
  "purpose" varchar(32) NOT NULL,
  "otpHash" varchar(255) NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "wrongAttempts" int NOT NULL DEFAULT 0,
  "verifyLockedUntil" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "uq_otp_phone_purpose" UNIQUE ("phone", "purpose")
);

CREATE TABLE IF NOT EXISTS "pending_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(16) NOT NULL,
  "fullName" varchar(200) NOT NULL,
  "passwordHash" varchar(255) NOT NULL,
  "accountType" varchar(32) NOT NULL,
  "pendingExpiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "uq_pending_registrations_phone" UNIQUE ("phone")
);
