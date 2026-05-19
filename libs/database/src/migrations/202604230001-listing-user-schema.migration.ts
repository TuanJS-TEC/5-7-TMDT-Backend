import { MigrationInterface, QueryRunner } from 'typeorm';

export class ListingUserSchema1745366400000 implements MigrationInterface {
  name = 'ListingUserSchema1745366400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "shareCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "favoriteCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "contactCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "pushedAt" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestDetails" text`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestedBy" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "modificationRequestedAt" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "imageAiFailureCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "manualImageReviewRequested" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "pendingManualReviewImageUrl" text`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "imageModerationState" character varying(64) NOT NULL DEFAULT 'none'`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "removedBy" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "adminRemovalReason" text`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "listingId" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_listing_unique"
      ON "favorites" ("userId", "listingId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "listingId" uuid,
        "targetType" character varying(32) NOT NULL DEFAULT 'listing',
        "targetId" uuid NOT NULL,
        "reporterId" uuid NOT NULL,
        "reason" character varying(64) NOT NULL,
        "description" text NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "evidenceImages" text,
        "evidenceMessages" text,
        "evidenceVideos" text,
        "processedBy" uuid,
        "processedAt" TIMESTAMPTZ,
        "processedAction" character varying(64),
        "processedNote" text,
        "actionExecutionStatus" character varying(32),
        "notificationPrimaryChannel" character varying(32),
        "notificationFinalChannel" character varying(32),
        "notificationFallbackUsed" boolean,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "listingId" uuid`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetType" character varying(32) NOT NULL DEFAULT 'listing'`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetId" uuid`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reporterId" uuid`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reason" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "description" text`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "status" character varying(32) NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceImages" text`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceMessages" text`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "evidenceVideos" text`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedAction" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "processedNote" text`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "actionExecutionStatus" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationPrimaryChannel" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationFinalChannel" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "notificationFallbackUsed" boolean`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()`);

    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canSell" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationStatus" character varying(32) NOT NULL DEFAULT 'none'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latestRequestId" uuid`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "identity_verification_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "documentType" character varying(16) NOT NULL DEFAULT 'cccd',
        "idImageUrl" character varying(1024) NOT NULL,
        "aiCheckStatus" character varying(32) NOT NULL DEFAULT 'passed',
        "status" character varying(32) NOT NULL DEFAULT 'pending_admin_review',
        "reviewedAt" TIMESTAMPTZ,
        "reviewedBy" uuid,
        "adminNote" text,
        "rejectionReason" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_identity_verification_requests_userId"
      ON "identity_verification_requests" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_identity_verification_requests_status"
      ON "identity_verification_requests" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_identity_verification_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_identity_verification_requests_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "identity_verification_requests"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "latestRequestId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationStatus"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "canSell"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "favorites_user_listing_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites"`);

    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "isDeleted"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "adminRemovalReason"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "removedBy"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "removedAt"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "imageModerationState"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "pendingManualReviewImageUrl"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "manualImageReviewRequested"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "imageAiFailureCount"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "modificationRequestedAt"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "modificationRequestedBy"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "modificationRequestDetails"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "featuredUntil"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "isFeatured"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "pushedAt"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "contactCount"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "favoriteCount"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "viewCount"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "shareCount"`);
  }
}
