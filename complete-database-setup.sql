-- ============================================
-- COMPLETE MULTI-TENANT DATABASE SETUP
-- Run this in Supabase SQL Editor
-- This creates ALL tables with multi-tenancy built in
-- ============================================

-- Drop existing tables if you need a fresh start (CAREFUL - THIS DELETES DATA!)
-- Uncomment these lines ONLY if you want to start completely fresh:
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

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
  "slug" TEXT NOT NULL UNIQUE,
  "emailSlug" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncAt" TIMESTAMP(3),
  "plan" TEXT DEFAULT 'free',
  "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_status_idx" ON "tenants"("status");

-- ============================================
-- STEP 3: CREATE USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "profilePhoto" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'AGENT',
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");

-- ============================================
-- STEP 4: CREATE USER_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "licenseNumber" TEXT,
  "licenseState" TEXT,
  "licenseExpiration" TIMESTAMP(3),
  "npn" TEXT UNIQUE,
  "gaid" TEXT UNIQUE,
  "agencyName" TEXT,
  "yearsOfExperience" INTEGER,
  "specializations" TEXT[],
  "photoUrl" TEXT,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_profiles_npn_idx" ON "user_profiles"("npn");
CREATE INDEX IF NOT EXISTS "user_profiles_gaid_idx" ON "user_profiles"("gaid");

-- ============================================
-- STEP 5: CREATE ORGANIZATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "parentId" TEXT,
  "ein" TEXT UNIQUE,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "organizations_tenantId_idx" ON "organizations"("tenantId");
CREATE INDEX IF NOT EXISTS "organizations_parentId_idx" ON "organizations"("parentId");

-- ============================================
-- STEP 6: CREATE ORGANIZATION_MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "organization_members" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "organization_members_organizationId_idx" ON "organization_members"("organizationId");
CREATE INDEX IF NOT EXISTS "organization_members_userId_idx" ON "organization_members"("userId");

-- ============================================
-- STEP 7: CREATE CASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "cases" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT,
  "clientPhone" TEXT,
  "status" "CaseStatus" NOT NULL DEFAULT 'LEAD',
  "insuranceType" "InsuranceType" NOT NULL,
  "coverageAmount" DECIMAL(15,2),
  "premium" DECIMAL(10,2),
  "policyNumber" TEXT,
  "carrier" TEXT,
  "notes" TEXT,
  "expectedCloseDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cases_tenantId_idx" ON "cases"("tenantId");
CREATE INDEX IF NOT EXISTS "cases_agentId_idx" ON "cases"("agentId");
CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases"("status");
CREATE INDEX IF NOT EXISTS "cases_insuranceType_idx" ON "cases"("insuranceType");

-- ============================================
-- STEP 8: CREATE QUOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "quotes" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "insuranceType" "InsuranceType" NOT NULL,
  "coverageAmount" DECIMAL(15,2) NOT NULL,
  "premium" DECIMAL(10,2) NOT NULL,
  "term" INTEGER,
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "quotedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX IF NOT EXISTS "quotes_caseId_idx" ON "quotes"("caseId");
CREATE INDEX IF NOT EXISTS "quotes_agentId_idx" ON "quotes"("agentId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");

-- ============================================
-- STEP 9: CREATE COMMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "commissions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "caseId" TEXT,
  "policyNumber" TEXT,
  "carrier" TEXT NOT NULL,
  "productName" TEXT,
  "type" "CommissionType" NOT NULL,
  "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,2) NOT NULL,
  "premium" DECIMAL(10,2),
  "splitPercentage" DECIMAL(5,2) DEFAULT 100.00,
  "splitWithAgentId" TEXT,
  "expectedDate" TIMESTAMP(3),
  "receivedDate" TIMESTAMP(3),
  "paidDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commissions_tenantId_idx" ON "commissions"("tenantId");
CREATE INDEX IF NOT EXISTS "commissions_agentId_idx" ON "commissions"("agentId");
CREATE INDEX IF NOT EXISTS "commissions_caseId_idx" ON "commissions"("caseId");
CREATE INDEX IF NOT EXISTS "commissions_status_idx" ON "commissions"("status");
CREATE INDEX IF NOT EXISTS "commissions_type_idx" ON "commissions"("type");

-- ============================================
-- STEP 10: CREATE CONTRACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "contracts" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "contractNumber" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "terminationDate" TIMESTAMP(3),
  "commissionSchedule" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contracts_tenantId_idx" ON "contracts"("tenantId");
CREATE INDEX IF NOT EXISTS "contracts_agentId_idx" ON "contracts"("agentId");
CREATE INDEX IF NOT EXISTS "contracts_carrier_idx" ON "contracts"("carrier");

-- ============================================
-- STEP 11: CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "notifications"("tenantId");
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- ============================================
-- STEP 12: CREATE AUDIT_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "changes" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- ============================================
-- STEP 13: CREATE GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "goals" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "targetAmount" DECIMAL(15,2) NOT NULL,
  "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "goals_tenantId_idx" ON "goals"("tenantId");
CREATE INDEX IF NOT EXISTS "goals_userId_idx" ON "goals"("userId");

-- ============================================
-- STEP 14: CREATE SMARTOFFICE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "smartoffice_policies" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "policyNumber" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "productName" TEXT,
  "insuredName" TEXT NOT NULL,
  "premium" DECIMAL(10,2),
  "coverageAmount" DECIMAL(15,2),
  "issueDate" TIMESTAMP(3),
  "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
  "rawData" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "smartoffice_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smartoffice_policies_tenantId_idx" ON "smartoffice_policies"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_policies_policyNumber_idx" ON "smartoffice_policies"("policyNumber");

CREATE TABLE IF NOT EXISTS "smartoffice_agents" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "agentCode" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "rawData" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "smartoffice_agents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smartoffice_agents_tenantId_idx" ON "smartoffice_agents"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_agents_userId_idx" ON "smartoffice_agents"("userId");
CREATE INDEX IF NOT EXISTS "smartoffice_agents_agentCode_idx" ON "smartoffice_agents"("agentCode");

CREATE TABLE IF NOT EXISTS "smartoffice_sync_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "syncType" TEXT NOT NULL,
  "status" "SmartOfficeSyncStatus" NOT NULL,
  "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
  "recordsCreated" INTEGER NOT NULL DEFAULT 0,
  "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
  "recordsFailed" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "smartoffice_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smartoffice_sync_logs_tenantId_idx" ON "smartoffice_sync_logs"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_sync_logs_status_idx" ON "smartoffice_sync_logs"("status");

CREATE TABLE IF NOT EXISTS "smartoffice_custom_reports" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "query" JSONB NOT NULL,
  "schedule" TEXT,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "smartoffice_custom_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smartoffice_custom_reports_tenantId_idx" ON "smartoffice_custom_reports"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_custom_reports_createdById_idx" ON "smartoffice_custom_reports"("createdById");

CREATE TABLE IF NOT EXISTS "smartoffice_chat_history" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "query" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "smartoffice_chat_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "smartoffice_chat_history_tenantId_idx" ON "smartoffice_chat_history"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_chat_history_userId_idx" ON "smartoffice_chat_history"("userId");

-- ============================================
-- STEP 15: CREATE TRAINING & RESOURCES TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "courses" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructorId" TEXT,
  "thumbnailUrl" TEXT,
  "duration" INTEGER,
  "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "isCECourse" BOOLEAN NOT NULL DEFAULT false,
  "ceCredits" DECIMAL(3,1),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");
CREATE INDEX IF NOT EXISTS "courses_instructorId_idx" ON "courses"("instructorId");

CREATE TABLE IF NOT EXISTS "training_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructorId" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "meetingUrl" TEXT,
  "maxAttendees" INTEGER,
  "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "training_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "training_events_tenantId_idx" ON "training_events"("tenantId");
CREATE INDEX IF NOT EXISTS "training_events_instructorId_idx" ON "training_events"("instructorId");

CREATE TABLE IF NOT EXISTS "resources" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "fileUrl" TEXT,
  "fileType" TEXT,
  "fileSize" INTEGER,
  "uploadedById" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "resources_tenantId_idx" ON "resources"("tenantId");
CREATE INDEX IF NOT EXISTS "resources_uploadedById_idx" ON "resources"("uploadedById");

-- ============================================
-- STEP 16: CREATE HELP & SUPPORT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "product_info" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "insuranceType" "InsuranceType" NOT NULL,
  "description" TEXT,
  "features" TEXT[],
  "brochureUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_info_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_info_tenantId_idx" ON "product_info"("tenantId");
CREATE INDEX IF NOT EXISTS "product_info_carrier_idx" ON "product_info"("carrier");

CREATE TABLE IF NOT EXISTS "help_articles" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT[],
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "help_articles_tenantId_idx" ON "help_articles"("tenantId");
CREATE INDEX IF NOT EXISTS "help_articles_slug_idx" ON "help_articles"("slug");

CREATE TABLE IF NOT EXISTS "faqs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "faqs_tenantId_idx" ON "faqs"("tenantId");
CREATE INDEX IF NOT EXISTS "faqs_category_idx" ON "faqs"("category");

-- ============================================
-- STEP 17: ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Users -> Tenants
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenantId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- User Profiles -> Users
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_userId_fkey";
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Organizations -> Tenants
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_tenantId_fkey";
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Organizations -> Parent Organization
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_parentId_fkey";
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE SET NULL;

-- Organization Members -> Organizations
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_organizationId_fkey";
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Organization Members -> Users
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_userId_fkey";
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Cases -> Tenants
ALTER TABLE "cases" DROP CONSTRAINT IF EXISTS "cases_tenantId_fkey";
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Cases -> Users (Agent)
ALTER TABLE "cases" DROP CONSTRAINT IF EXISTS "cases_agentId_fkey";
ALTER TABLE "cases" ADD CONSTRAINT "cases_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Quotes -> Tenants
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_tenantId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Quotes -> Cases
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_caseId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE;

-- Quotes -> Users (Agent)
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_agentId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Commissions -> Tenants
ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_tenantId_fkey";
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Commissions -> Users (Agent)
ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_agentId_fkey";
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Commissions -> Cases
ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_caseId_fkey";
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL;

-- Contracts -> Tenants
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_tenantId_fkey";
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Contracts -> Users (Agent)
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_agentId_fkey";
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Notifications -> Tenants
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_tenantId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Notifications -> Users
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Audit Logs -> Tenants
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_tenantId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Audit Logs -> Users
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Goals -> Tenants
ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_tenantId_fkey";
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Goals -> Users
ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_userId_fkey";
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- SmartOffice tables
ALTER TABLE "smartoffice_policies" DROP CONSTRAINT IF EXISTS "smartoffice_policies_tenantId_fkey";
ALTER TABLE "smartoffice_policies" ADD CONSTRAINT "smartoffice_policies_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_agents" DROP CONSTRAINT IF EXISTS "smartoffice_agents_tenantId_fkey";
ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_agents" DROP CONSTRAINT IF EXISTS "smartoffice_agents_userId_fkey";
ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "smartoffice_sync_logs" DROP CONSTRAINT IF EXISTS "smartoffice_sync_logs_tenantId_fkey";
ALTER TABLE "smartoffice_sync_logs" ADD CONSTRAINT "smartoffice_sync_logs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_custom_reports" DROP CONSTRAINT IF EXISTS "smartoffice_custom_reports_tenantId_fkey";
ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_custom_reports" DROP CONSTRAINT IF EXISTS "smartoffice_custom_reports_createdById_fkey";
ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_chat_history" DROP CONSTRAINT IF EXISTS "smartoffice_chat_history_tenantId_fkey";
ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "smartoffice_chat_history" DROP CONSTRAINT IF EXISTS "smartoffice_chat_history_userId_fkey";
ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Training & Resources
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_tenantId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_instructorId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "training_events" DROP CONSTRAINT IF EXISTS "training_events_tenantId_fkey";
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "training_events" DROP CONSTRAINT IF EXISTS "training_events_instructorId_fkey";
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_tenantId_fkey";
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_uploadedById_fkey";
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE;

-- Help & Support
ALTER TABLE "product_info" DROP CONSTRAINT IF EXISTS "product_info_tenantId_fkey";
ALTER TABLE "product_info" ADD CONSTRAINT "product_info_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "help_articles" DROP CONSTRAINT IF EXISTS "help_articles_tenantId_fkey";
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "faqs" DROP CONSTRAINT IF EXISTS "faqs_tenantId_fkey";
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- ============================================
-- STEP 18: CREATE DEFAULT TENANT
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
-- STEP 19: UPDATE EXISTING DATA (if any)
-- ============================================

UPDATE "users" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "organizations" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "cases" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "quotes" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "commissions" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "contracts" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "notifications" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "audit_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "goals" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "courses" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "training_events" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "resources" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "product_info" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "help_articles" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "faqs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "smartoffice_policies" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "smartoffice_agents" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "smartoffice_sync_logs" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "smartoffice_custom_reports" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';
UPDATE "smartoffice_chat_history" SET "tenantId" = 'valor-default-tenant' WHERE "tenantId" IS NULL OR "tenantId" = '';

-- ============================================
-- COMPLETE! Next Steps:
-- 1. Run this SQL in Supabase Dashboard SQL Editor
-- 2. Then run: npx prisma generate
-- 3. Test at: http://valor.localhost:2050
-- ============================================
