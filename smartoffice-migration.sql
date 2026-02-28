-- ============================================================
-- SMARTOFFICE TABLES MIGRATION
-- Creates all SmartOffice-related database tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create Enums
CREATE TYPE "SmartOfficePolicyType" AS ENUM ('LIFE', 'ANNUITY', 'OTHER');
CREATE TYPE "SmartOfficePolicyStatus" AS ENUM ('ACTIVE', 'PENDING', 'ISSUED', 'DECLINED', 'LAPSED', 'SURRENDERED', 'UNKNOWN');

-- ============================================================
-- TABLE 1: smartoffice_policies
-- ============================================================
CREATE TABLE "smartoffice_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "primaryAdvisor" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "carrierName" TEXT NOT NULL,
    "primaryInsured" TEXT NOT NULL,
    "statusDate" TIMESTAMP(3),
    "type" "SmartOfficePolicyType" NOT NULL,
    "status" "SmartOfficePolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "targetAmount" DOUBLE PRECISION,
    "commAnnualizedPrem" DOUBLE PRECISION,
    "weightedPremium" DOUBLE PRECISION,
    "firstYearCommission" DOUBLE PRECISION,
    "renewalCommission" DOUBLE PRECISION,
    "additionalData" JSONB,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_policies_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE 2: smartoffice_agents
-- ============================================================
CREATE TABLE "smartoffice_agents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phones" TEXT,
    "addresses" TEXT,
    "supervisor" TEXT,
    "subSource" TEXT,
    "contractList" TEXT,
    "ssn" TEXT,
    "npn" TEXT,
    "additionalData" JSONB,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "searchText" TEXT,
    "linkedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_agents_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE 3: smartoffice_sync_logs
-- ============================================================
CREATE TABLE "smartoffice_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errors" JSONB,
    "warnings" JSONB,
    "filesProcessedList" TEXT[],
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smartoffice_sync_logs_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE 4: smartoffice_custom_reports
-- ============================================================
CREATE TABLE "smartoffice_custom_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "groupBy" TEXT[],
    "sortBy" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT,
    "recipients" TEXT[],
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_custom_reports_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- TABLE 5: smartoffice_chat_history
-- ============================================================
CREATE TABLE "smartoffice_chat_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "queryType" TEXT,
    "sqlGenerated" TEXT,
    "resultsCount" INTEGER,
    "results" JSONB,
    "tokensUsed" INTEGER,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smartoffice_chat_history_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- INDEXES
-- ============================================================

-- smartoffice_policies indexes
CREATE UNIQUE INDEX "smartoffice_policies_policyNumber_key" ON "smartoffice_policies"("policyNumber");
CREATE INDEX "smartoffice_policies_tenantId_idx" ON "smartoffice_policies"("tenantId");
CREATE INDEX "smartoffice_policies_policyNumber_idx" ON "smartoffice_policies"("policyNumber");
CREATE INDEX "smartoffice_policies_primaryAdvisor_idx" ON "smartoffice_policies"("primaryAdvisor");
CREATE INDEX "smartoffice_policies_carrierName_idx" ON "smartoffice_policies"("carrierName");
CREATE INDEX "smartoffice_policies_type_idx" ON "smartoffice_policies"("type");
CREATE INDEX "smartoffice_policies_status_idx" ON "smartoffice_policies"("status");
CREATE INDEX "smartoffice_policies_statusDate_idx" ON "smartoffice_policies"("statusDate");
CREATE INDEX "smartoffice_policies_lastSyncDate_idx" ON "smartoffice_policies"("lastSyncDate");

-- smartoffice_agents indexes
CREATE INDEX "smartoffice_agents_tenantId_idx" ON "smartoffice_agents"("tenantId");
CREATE INDEX "smartoffice_agents_fullName_idx" ON "smartoffice_agents"("fullName");
CREATE INDEX "smartoffice_agents_email_idx" ON "smartoffice_agents"("email");
CREATE INDEX "smartoffice_agents_npn_idx" ON "smartoffice_agents"("npn");
CREATE INDEX "smartoffice_agents_supervisor_idx" ON "smartoffice_agents"("supervisor");
CREATE INDEX "smartoffice_agents_subSource_idx" ON "smartoffice_agents"("subSource");
CREATE INDEX "smartoffice_agents_lastSyncDate_idx" ON "smartoffice_agents"("lastSyncDate");
CREATE INDEX "smartoffice_agents_linkedUserId_idx" ON "smartoffice_agents"("linkedUserId");

-- smartoffice_sync_logs indexes
CREATE INDEX "smartoffice_sync_logs_tenantId_idx" ON "smartoffice_sync_logs"("tenantId");
CREATE INDEX "smartoffice_sync_logs_syncType_idx" ON "smartoffice_sync_logs"("syncType");
CREATE INDEX "smartoffice_sync_logs_status_idx" ON "smartoffice_sync_logs"("status");
CREATE INDEX "smartoffice_sync_logs_startedAt_idx" ON "smartoffice_sync_logs"("startedAt");

-- smartoffice_custom_reports indexes
CREATE INDEX "smartoffice_custom_reports_tenantId_idx" ON "smartoffice_custom_reports"("tenantId");
CREATE INDEX "smartoffice_custom_reports_createdBy_idx" ON "smartoffice_custom_reports"("createdBy");
CREATE INDEX "smartoffice_custom_reports_reportType_idx" ON "smartoffice_custom_reports"("reportType");
CREATE INDEX "smartoffice_custom_reports_isScheduled_idx" ON "smartoffice_custom_reports"("isScheduled");

-- smartoffice_chat_history indexes
CREATE INDEX "smartoffice_chat_history_tenantId_idx" ON "smartoffice_chat_history"("tenantId");
CREATE INDEX "smartoffice_chat_history_userId_idx" ON "smartoffice_chat_history"("userId");
CREATE INDEX "smartoffice_chat_history_sessionId_idx" ON "smartoffice_chat_history"("sessionId");
CREATE INDEX "smartoffice_chat_history_createdAt_idx" ON "smartoffice_chat_history"("createdAt");

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

ALTER TABLE "smartoffice_policies" ADD CONSTRAINT "smartoffice_policies_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_linkedUserId_fkey"
    FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "smartoffice_sync_logs" ADD CONSTRAINT "smartoffice_sync_logs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Created 5 SmartOffice tables:
--   1. smartoffice_policies (policy data)
--   2. smartoffice_agents (agent data)
--   3. smartoffice_sync_logs (import tracking)
--   4. smartoffice_custom_reports (saved reports)
--   5. smartoffice_chat_history (AI chat logs)
--
-- All tables have tenant isolation via tenantId foreign key
-- CASCADE DELETE ensures cleanup when tenant is deleted
-- ============================================================
