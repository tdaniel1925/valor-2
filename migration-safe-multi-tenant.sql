-- ============================================
-- SAFE MULTI-TENANT MIGRATION
-- Handles existing tables only - won't fail on missing tables
-- ============================================

-- ============================================
-- STEP 1: CREATE ENUMS (Safe - won't fail if exists)
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

DO $$ BEGIN
  CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX "tenants_status_idx" ON "tenants"("status");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

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
-- STEP 4: ADD COLUMNS, INDEXES, AND CONSTRAINTS
-- For each table: Only if table exists
-- ============================================

-- USERS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Add column if doesn't exist
    BEGIN
      ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    -- Update existing records
    UPDATE "users" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    -- Create index
    BEGIN
      CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    -- Add foreign key
    BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    -- Set NOT NULL
    BEGIN
      ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- ORGANIZATIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    BEGIN
      ALTER TABLE "organizations" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "organizations" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "organizations_tenantId_idx" ON "organizations"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "organizations" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- CASES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cases') THEN
    BEGIN
      ALTER TABLE "cases" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "cases" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "cases_tenantId_idx" ON "cases"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "cases" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- QUOTES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    BEGIN
      ALTER TABLE "quotes" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "quotes" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "quotes" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- COMMISSIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commissions') THEN
    BEGIN
      ALTER TABLE "commissions" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "commissions" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "commissions_tenantId_idx" ON "commissions"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "commissions" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- CONTRACTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts') THEN
    BEGIN
      ALTER TABLE "contracts" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "contracts" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "contracts_tenantId_idx" ON "contracts"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "contracts" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- NOTIFICATIONS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    BEGIN
      ALTER TABLE "notifications" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "notifications" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "notifications" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- AUDIT_LOGS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    BEGIN
      ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "audit_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- GOALS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goals') THEN
    BEGIN
      ALTER TABLE "goals" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "goals" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "goals_tenantId_idx" ON "goals"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "goals" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- COURSES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    BEGIN
      ALTER TABLE "courses" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "courses" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "courses_tenantId_idx" ON "courses"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "courses" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- TRAINING_EVENTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_events') THEN
    BEGIN
      ALTER TABLE "training_events" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "training_events" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "training_events_tenantId_idx" ON "training_events"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "training_events" ADD CONSTRAINT "training_events_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "training_events" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- RESOURCES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resources') THEN
    BEGIN
      ALTER TABLE "resources" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "resources" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "resources_tenantId_idx" ON "resources"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "resources" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- PRODUCT_INFO
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_info') THEN
    BEGIN
      ALTER TABLE "product_info" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "product_info" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "product_info_tenantId_idx" ON "product_info"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "product_info" ADD CONSTRAINT "product_info_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "product_info" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- HELP_ARTICLES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'help_articles') THEN
    BEGIN
      ALTER TABLE "help_articles" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "help_articles" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "help_articles_tenantId_idx" ON "help_articles"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "help_articles" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- FAQS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    BEGIN
      ALTER TABLE "faqs" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "faqs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "faqs_tenantId_idx" ON "faqs"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "faqs" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- SMARTOFFICE_POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smartoffice_policies') THEN
    BEGIN
      ALTER TABLE "smartoffice_policies" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "smartoffice_policies" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "smartoffice_policies_tenantId_idx" ON "smartoffice_policies"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_policies" ADD CONSTRAINT "smartoffice_policies_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_policies" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- SMARTOFFICE_AGENTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smartoffice_agents') THEN
    BEGIN
      ALTER TABLE "smartoffice_agents" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "smartoffice_agents" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "smartoffice_agents_tenantId_idx" ON "smartoffice_agents"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_agents" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- SMARTOFFICE_SYNC_LOGS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smartoffice_sync_logs') THEN
    BEGIN
      ALTER TABLE "smartoffice_sync_logs" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "smartoffice_sync_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "smartoffice_sync_logs_tenantId_idx" ON "smartoffice_sync_logs"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_sync_logs" ADD CONSTRAINT "smartoffice_sync_logs_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_sync_logs" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- SMARTOFFICE_CUSTOM_REPORTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smartoffice_custom_reports') THEN
    BEGIN
      ALTER TABLE "smartoffice_custom_reports" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "smartoffice_custom_reports" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "smartoffice_custom_reports_tenantId_idx" ON "smartoffice_custom_reports"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_custom_reports" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- SMARTOFFICE_CHAT_HISTORY
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smartoffice_chat_history') THEN
    BEGIN
      ALTER TABLE "smartoffice_chat_history" ADD COLUMN "tenantId" TEXT;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END;

    UPDATE "smartoffice_chat_history" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

    BEGIN
      CREATE INDEX "smartoffice_chat_history_tenantId_idx" ON "smartoffice_chat_history"("tenantId");
    EXCEPTION
      WHEN duplicate_table THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;

    BEGIN
      ALTER TABLE "smartoffice_chat_history" ALTER COLUMN "tenantId" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT
  'Migration complete!' as status,
  (SELECT COUNT(*) FROM tenants WHERE id = 'valor-default-tenant') as default_tenant_created,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('users', 'organizations', 'cases', 'quotes', 'commissions', 'contracts',
                      'notifications', 'audit_logs', 'goals', 'courses', 'training_events',
                      'resources', 'product_info', 'help_articles', 'faqs',
                      'smartoffice_policies', 'smartoffice_agents', 'smartoffice_sync_logs',
                      'smartoffice_custom_reports', 'smartoffice_chat_history')
  ) as tables_found;
