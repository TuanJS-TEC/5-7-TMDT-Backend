-- Schema patch for:
-- 1) listing-service DB-backed repositories (listings/favorites/reports)
-- 2) user-service identity verification (users + identity_verification_requests)
--
-- Usage:
-- psql -h localhost -U postgres -d car_marketplace -f scripts/listing-user-schema-patch.sql

-- Ensure uuid generation is available (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1) listings: add columns required by ListingOrmEntity
-- =========================================================
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "shareCount" int NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "viewCount" int NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "favoriteCount" int NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "contactCount" int NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "pushedAt" timestamptz;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featuredUntil" timestamptz;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestDetails" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestedBy" varchar(64);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestedAt" timestamptz;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "imageAiFailureCount" int NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "manualImageReviewRequested" boolean NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "pendingManualReviewImageUrl" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "imageModerationState" varchar(64) NOT NULL DEFAULT 'none';
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "removedAt" timestamptz;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "removedBy" varchar(64);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "adminRemovalReason" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "expiresAt" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false;

-- =========================================================
-- 2) favorites table (for FavoriteOrmEntity)
-- =========================================================
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "listingId" uuid NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_listing_unique"
  ON "favorites" ("userId", "listingId");

-- =========================================================
-- 3) reports table (for ReportOrmEntity)
-- =========================================================
CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "listingId" uuid,
  "targetType" varchar(32) NOT NULL DEFAULT 'listing',
  "targetId" uuid NOT NULL,
  "reporterId" uuid NOT NULL,
  "reason" varchar(64) NOT NULL,
  "description" text NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'pending',
  "evidenceImages" text,
  "evidenceMessages" text,
  "evidenceVideos" text,
  "processedBy" uuid,
  "processedAt" timestamptz,
  "processedAction" varchar(64),
  "processedNote" text,
  "actionExecutionStatus" varchar(32),
  "notificationPrimaryChannel" varchar(32),
  "notificationFinalChannel" varchar(32),
  "notificationFallbackUsed" boolean,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "listingId" uuid;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetType" varchar(32) NOT NULL DEFAULT 'listing';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetId" uuid;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reporterId" uuid;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reason" varchar(64);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'pending';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceImages" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceMessages" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceVideos" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedBy" uuid;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedAt" timestamptz;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedAction" varchar(64);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedNote" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "actionExecutionStatus" varchar(32);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationPrimaryChannel" varchar(32);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationFinalChannel" varchar(32);
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationFallbackUsed" boolean;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now();
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

-- =========================================================
-- 4) users table additions for identity verification state
-- =========================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canSell" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationStatus" varchar(32) NOT NULL DEFAULT 'none';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latestRequestId" uuid;

-- =========================================================
-- 5) identity_verification_requests table
-- =========================================================
CREATE TABLE IF NOT EXISTS "identity_verification_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "documentType" varchar(16) NOT NULL DEFAULT 'cccd',
  "idImageUrl" varchar(1024) NOT NULL,
  "aiCheckStatus" varchar(32) NOT NULL DEFAULT 'passed',
  "status" varchar(32) NOT NULL DEFAULT 'pending_admin_review',
  "reviewedAt" timestamptz,
  "reviewedBy" uuid,
  "adminNote" text,
  "rejectionReason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_identity_verification_requests_userId"
  ON "identity_verification_requests" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_identity_verification_requests_status"
  ON "identity_verification_requests" ("status");
