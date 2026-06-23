-- ============================================
-- AI TOOLS — output tables
-- Run this in the Supabase SQL Editor (app DB role cannot run DDL).
-- Idempotent: safe to run more than once.
--
-- These tables are tenant-scoped IN THE API LAYER (every query filters by
-- tenantId). RLS is explicitly DISABLED to match the firelight_*/lms_* tables.
-- If Supabase's security advisor re-enables RLS on them, writes will fail 42501
-- and reads return empty — re-run section 6 to disable.
-- ============================================

-- 1. AI findings (Revenue Intelligence writes; Meeting Prep / chat read)
CREATE TABLE IF NOT EXISTS ai_findings (
    "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"     TEXT NOT NULL,
    "category"     TEXT NOT NULL,
    "severity"     TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "dollarImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actionLabel"  TEXT,
    "advisor"      TEXT,
    "status"       TEXT NOT NULL DEFAULT 'open',
    "dismissedAt"  TIMESTAMP(3),
    "dismissedBy"  TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_findings_tenantId_idx" ON ai_findings("tenantId");
CREATE INDEX IF NOT EXISTS "ai_findings_tenant_status_idx" ON ai_findings("tenantId", "status");

-- 2. AI chat memory (per user/key)
CREATE TABLE IF NOT EXISTS ai_chat_memory (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ai_chat_memory_tenant_user_key" ON ai_chat_memory("tenantId", "userId", "key");
CREATE INDEX IF NOT EXISTS "ai_chat_memory_tenant_user_idx" ON ai_chat_memory("tenantId", "userId");

-- 3. AI email drafts (Smart Emails)
CREATE TABLE IF NOT EXISTS ai_email_drafts (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "recipient" TEXT,
    "subject"   TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "context"   TEXT,
    "status"    TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_email_drafts_tenant_user_idx" ON ai_email_drafts("tenantId", "userId");

-- 4. AI coaching plans (Agent Coach)
CREATE TABLE IF NOT EXISTS ai_coaching_plans (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL,
    "advisor"   TEXT NOT NULL,
    "plan"      JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_coaching_plans_tenantId_idx" ON ai_coaching_plans("tenantId");
CREATE INDEX IF NOT EXISTS "ai_coaching_plans_tenant_advisor_idx" ON ai_coaching_plans("tenantId", "advisor");

-- 5b. AI conversations + messages (ChatGPT-style threads for the AI Assistant)
CREATE TABLE IF NOT EXISTS ai_conversations (
    "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "title"     TEXT NOT NULL DEFAULT 'New chat',
    "pinned"    BOOLEAN NOT NULL DEFAULT false,
    "archived"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_conversations_tenant_user_idx" ON ai_conversations("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "ai_conversations_tenant_user_pin_idx" ON ai_conversations("tenantId", "userId", "pinned", "updatedAt");

CREATE TABLE IF NOT EXISTS ai_messages (
    "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL REFERENCES ai_conversations("id") ON DELETE CASCADE,
    "role"           TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_idx" ON ai_messages("conversationId", "createdAt");

-- 6. RLS must be OFF on these tables (tenant scoping is in the API layer).
ALTER TABLE ai_findings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_memory    DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_drafts   DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaching_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations  DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages       DISABLE ROW LEVEL SECURITY;
