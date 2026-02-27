-- ============================================
-- MULTI-TENANT FOUNDATION MIGRATION
-- Run this in Supabase SQL Editor or via CLI
-- ============================================

-- Step 1: Create TenantStatus enum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED');

-- Step 2: Create tenants table
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emailSlug" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "plan" TEXT DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create indexes on tenants
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_emailSlug_key" ON "tenants"("emailSlug");
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- Step 4: Add tenantId columns to all tables
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "organizations" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "contracts" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "quotes" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "cases" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "commissions" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "goals" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "courses" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "training_events" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "resources" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "product_info" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "help_articles" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "faqs" ADD COLUMN "tenantId" TEXT;

-- Step 5: Create indexes on tenantId
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX "organizations_tenantId_idx" ON "organizations"("tenantId");
CREATE INDEX "contracts_tenantId_idx" ON "contracts"("tenantId");
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX "cases_tenantId_idx" ON "cases"("tenantId");
CREATE INDEX "commissions_tenantId_idx" ON "commissions"("tenantId");
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX "goals_tenantId_idx" ON "goals"("tenantId");
CREATE INDEX "courses_tenantId_idx" ON "courses"("tenantId");
CREATE INDEX "training_events_tenantId_idx" ON "training_events"("tenantId");
CREATE INDEX "resources_tenantId_idx" ON "resources"("tenantId");
CREATE INDEX "product_info_tenantId_idx" ON "product_info"("tenantId");
CREATE INDEX "help_articles_tenantId_idx" ON "help_articles"("tenantId");
CREATE INDEX "faqs_tenantId_idx" ON "faqs"("tenantId");

-- Step 6: Create default tenant
INSERT INTO "tenants" (
  "id",
  "name",
  "slug",
  "emailSlug",
  "emailVerified",
  "status",
  "createdAt",
  "updatedAt"
)
VALUES (
  'valor-default-tenant',
  'Valor Financial Specialists',
  'valor',
  'valor@reports.valorfs.app',
  true,
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Step 7: Update existing records to point to default tenant
UPDATE "users" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "organizations" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "contracts" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "quotes" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "cases" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "commissions" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "notifications" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "audit_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "goals" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "courses" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "training_events" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "resources" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "product_info" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "help_articles" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;
UPDATE "faqs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL;

-- Step 8: Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "product_info" ADD CONSTRAINT "product_info_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Step 9: Make tenantId NOT NULL
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "organizations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "contracts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "quotes" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "cases" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "commissions" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "goals" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "training_events" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "resources" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "product_info" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "help_articles" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "faqs" ALTER COLUMN "tenantId" SET NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- Next step: Enable RLS (run rls-migration.sql)
-- ============================================
