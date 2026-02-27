-- ============================================
-- COMPLETE MULTI-TENANT DATABASE SETUP (FIXED)
-- Run this in Supabase SQL Editor
-- Handles both new and existing tables
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('AGENT', 'MANAGER', 'ADMINISTRATOR', 'EXECUTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CaseStatus" AS ENUM ('LEAD', 'QUOTE', 'APPLICATION', 'PENDING', 'ISSUED', 'DECLINED', 'WITHDRAWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InsuranceType" AS ENUM ('TERM_LIFE', 'WHOLE_LIFE', 'UNIVERSAL_LIFE', 'VARIABLE_LIFE', 'LONG_TERM_CARE', 'DISABILITY', 'ANNUITY', 'MEDICARE_SUPPLEMENT', 'FINAL_EXPENSE', 'CRITICAL_ILLNESS', 'ACCIDENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'QUOTED', 'SELECTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionType" AS ENUM ('FIRST_YEAR', 'RENEWAL', 'OVERRIDE', 'TRAIL', 'BONUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'EXPECTED', 'RECEIVED', 'PAID', 'SPLIT', 'DISPUTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('COMMISSION_RECEIVED', 'POLICY_ISSUED', 'CASE_UPDATE', 'SYSTEM_ALERT', 'GOAL_MILESTONE', 'TRAINING_REMINDER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'LAPSED', 'SURRENDERED', 'DEATH_CLAIM', 'PENDING', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SmartOfficeSyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: CREATE TENANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "tenants" (
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

DO $$ BEGIN
  CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "tenants_emailSlug_key" ON "tenants"("emailSlug");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_status_idx" ON "tenants"("status");

-- ============================================
-- STEP 3: CREATE DEFAULT TENANT
-- ============================================

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
)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- STEP 4: ADD TENANTID COLUMNS TO EXISTING TABLES
-- This handles tables that already exist
-- ============================================

-- Add tenantId to users if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add tenantId to organizations if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "organizations" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to cases if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "cases" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to quotes if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "quotes" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to commissions if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "commissions" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to contracts if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "contracts" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to notifications if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "notifications" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to audit_logs if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to goals if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "goals" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to courses if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "courses" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to training_events if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "training_events" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to resources if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "resources" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to product_info if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "product_info" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to help_articles if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "help_articles" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to faqs if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "faqs" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to smartoffice_policies if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "smartoffice_policies" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to smartoffice_agents if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "smartoffice_agents" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to smartoffice_sync_logs if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "smartoffice_sync_logs" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to smartoffice_custom_reports if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "smartoffice_custom_reports" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Add tenantId to smartoffice_chat_history if it doesn't exist
DO $$ BEGIN
  ALTER TABLE "smartoffice_chat_history" ADD COLUMN "tenantId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_table THEN null;
END $$;

-- ============================================
-- STEP 5: CREATE INDEXES ON TENANTID
-- ============================================

CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "organizations_tenantId_idx" ON "organizations"("tenantId");
CREATE INDEX IF NOT EXISTS "cases_tenantId_idx" ON "cases"("tenantId");
CREATE INDEX IF NOT EXISTS "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX IF NOT EXISTS "commissions_tenantId_idx" ON "commissions"("tenantId");
CREATE INDEX IF NOT EXISTS "contracts_tenantId_idx" ON "contracts"("tenantId");
CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "notifications"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "goals_tenantId_idx" ON "goals"("tenantId");
CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");
CREATE INDEX IF NOT EXISTS "training_events_tenantId_idx" ON "training_events"("tenantId");
CREATE INDEX IF NOT EXISTS "resources_tenantId_idx" ON "resources"("tenantId");
CREATE INDEX IF NOT EXISTS "product_info_tenantId_idx" ON "product_info"("tenantId");
CREATE INDEX IF NOT EXISTS "help_articles_tenantId_idx" ON "help_articles"("tenantId");
CREATE INDEX IF NOT EXISTS "faqs_tenantId_idx" ON "faqs"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_policies_tenantId_idx" ON "smartoffice_policies"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_agents_tenantId_idx" ON "smartoffice_agents"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_sync_logs_tenantId_idx" ON "smartoffice_sync_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_custom_reports_tenantId_idx" ON "smartoffice_custom_reports"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_chat_history_tenantId_idx" ON "smartoffice_chat_history"("tenantId");

-- ============================================
-- STEP 6: UPDATE EXISTING DATA
-- Set tenantId for all existing records
-- ============================================

-- Only update if the table exists and has the column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE "users" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    UPDATE "organizations" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cases') THEN
    UPDATE "cases" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
    UPDATE "quotes" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commissions') THEN
    UPDATE "commissions" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contracts') THEN
    UPDATE "contracts" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    UPDATE "notifications" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    UPDATE "audit_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'goals') THEN
    UPDATE "goals" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    UPDATE "courses" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_events') THEN
    UPDATE "training_events" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resources') THEN
    UPDATE "resources" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_info') THEN
    UPDATE "product_info" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'help_articles') THEN
    UPDATE "help_articles" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'faqs') THEN
    UPDATE "faqs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'smartoffice_policies') THEN
    UPDATE "smartoffice_policies" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'smartoffice_agents') THEN
    UPDATE "smartoffice_agents" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'smartoffice_sync_logs') THEN
    UPDATE "smartoffice_sync_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'smartoffice_custom_reports') THEN
    UPDATE "smartoffice_custom_reports" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'smartoffice_chat_history') THEN
    UPDATE "smartoffice_chat_history" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
  END IF;
END $$;

-- ============================================
-- STEP 7: ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Users -> Tenants
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Organizations -> Tenants
DO $$ BEGIN
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Cases -> Tenants
DO $$ BEGIN
  ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Quotes -> Tenants
DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Commissions -> Tenants
DO $$ BEGIN
  ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Contracts -> Tenants
DO $$ BEGIN
  ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Notifications -> Tenants
DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Audit Logs -> Tenants
DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Goals -> Tenants
DO $$ BEGIN
  ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Courses -> Tenants
DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Training Events -> Tenants
DO $$ BEGIN
  ALTER TABLE "training_events" ADD CONSTRAINT "training_events_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Resources -> Tenants
DO $$ BEGIN
  ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Product Info -> Tenants
DO $$ BEGIN
  ALTER TABLE "product_info" ADD CONSTRAINT "product_info_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- Help Articles -> Tenants
DO $$ BEGIN
  ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- FAQs -> Tenants
DO $$ BEGIN
  ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- SmartOffice tables
DO $$ BEGIN
  ALTER TABLE "smartoffice_policies" ADD CONSTRAINT "smartoffice_policies_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_sync_logs" ADD CONSTRAINT "smartoffice_sync_logs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- ============================================
-- STEP 8: MAKE TENANTID NOT NULL
-- Only after we've populated existing records
-- ============================================

DO $$ BEGIN
  ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "organizations" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "cases" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "quotes" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "commissions" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "contracts" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notifications" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "goals" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "courses" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "training_events" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "resources" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_info" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "help_articles" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "faqs" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_policies" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_agents" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_sync_logs" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_custom_reports" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_chat_history" ALTER COLUMN "tenantId" SET NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

-- ============================================
-- COMPLETE!
-- ============================================

-- Verify migration
SELECT
  'Migration complete!' as status,
  COUNT(*) as tenant_count
FROM tenants
WHERE id = 'valor-default-tenant';
