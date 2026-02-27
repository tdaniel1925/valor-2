-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces tenant isolation at database level
-- ============================================

-- This uses PostgreSQL session variables to enforce tenant boundaries.
-- Before each query, set: SET LOCAL app.current_tenant_id = 'tenant-id-here';
-- RLS will automatically filter all queries to only show/modify that tenant's data.

-- ============================================
-- STEP 1: ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_info" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables that may not exist yet (safe to fail)
DO $$ BEGIN
  ALTER TABLE "help_articles" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_policies" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_agents" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_sync_logs" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_custom_reports" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "smartoffice_chat_history" ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- ============================================
-- STEP 2: CREATE HELPER FUNCTION
-- Gets the current tenant ID from session variable
-- ============================================

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- Each table gets SELECT/INSERT/UPDATE/DELETE policies
-- ============================================

-- USERS
DROP POLICY IF EXISTS "users_tenant_isolation_select" ON "users";
CREATE POLICY "users_tenant_isolation_select" ON "users"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "users_tenant_isolation_insert" ON "users";
CREATE POLICY "users_tenant_isolation_insert" ON "users"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "users_tenant_isolation_update" ON "users";
CREATE POLICY "users_tenant_isolation_update" ON "users"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "users_tenant_isolation_delete" ON "users";
CREATE POLICY "users_tenant_isolation_delete" ON "users"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- ORGANIZATIONS
DROP POLICY IF EXISTS "organizations_tenant_isolation_select" ON "organizations";
CREATE POLICY "organizations_tenant_isolation_select" ON "organizations"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "organizations_tenant_isolation_insert" ON "organizations";
CREATE POLICY "organizations_tenant_isolation_insert" ON "organizations"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "organizations_tenant_isolation_update" ON "organizations";
CREATE POLICY "organizations_tenant_isolation_update" ON "organizations"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "organizations_tenant_isolation_delete" ON "organizations";
CREATE POLICY "organizations_tenant_isolation_delete" ON "organizations"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- CASES
DROP POLICY IF EXISTS "cases_tenant_isolation_select" ON "cases";
CREATE POLICY "cases_tenant_isolation_select" ON "cases"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "cases_tenant_isolation_insert" ON "cases";
CREATE POLICY "cases_tenant_isolation_insert" ON "cases"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "cases_tenant_isolation_update" ON "cases";
CREATE POLICY "cases_tenant_isolation_update" ON "cases"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "cases_tenant_isolation_delete" ON "cases";
CREATE POLICY "cases_tenant_isolation_delete" ON "cases"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- QUOTES
DROP POLICY IF EXISTS "quotes_tenant_isolation_select" ON "quotes";
CREATE POLICY "quotes_tenant_isolation_select" ON "quotes"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "quotes_tenant_isolation_insert" ON "quotes";
CREATE POLICY "quotes_tenant_isolation_insert" ON "quotes"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "quotes_tenant_isolation_update" ON "quotes";
CREATE POLICY "quotes_tenant_isolation_update" ON "quotes"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "quotes_tenant_isolation_delete" ON "quotes";
CREATE POLICY "quotes_tenant_isolation_delete" ON "quotes"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- COMMISSIONS
DROP POLICY IF EXISTS "commissions_tenant_isolation_select" ON "commissions";
CREATE POLICY "commissions_tenant_isolation_select" ON "commissions"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "commissions_tenant_isolation_insert" ON "commissions";
CREATE POLICY "commissions_tenant_isolation_insert" ON "commissions"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "commissions_tenant_isolation_update" ON "commissions";
CREATE POLICY "commissions_tenant_isolation_update" ON "commissions"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "commissions_tenant_isolation_delete" ON "commissions";
CREATE POLICY "commissions_tenant_isolation_delete" ON "commissions"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- CONTRACTS
DROP POLICY IF EXISTS "contracts_tenant_isolation_select" ON "contracts";
CREATE POLICY "contracts_tenant_isolation_select" ON "contracts"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "contracts_tenant_isolation_insert" ON "contracts";
CREATE POLICY "contracts_tenant_isolation_insert" ON "contracts"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "contracts_tenant_isolation_update" ON "contracts";
CREATE POLICY "contracts_tenant_isolation_update" ON "contracts"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "contracts_tenant_isolation_delete" ON "contracts";
CREATE POLICY "contracts_tenant_isolation_delete" ON "contracts"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_tenant_isolation_select" ON "notifications";
CREATE POLICY "notifications_tenant_isolation_select" ON "notifications"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "notifications_tenant_isolation_insert" ON "notifications";
CREATE POLICY "notifications_tenant_isolation_insert" ON "notifications"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "notifications_tenant_isolation_update" ON "notifications";
CREATE POLICY "notifications_tenant_isolation_update" ON "notifications"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "notifications_tenant_isolation_delete" ON "notifications";
CREATE POLICY "notifications_tenant_isolation_delete" ON "notifications"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_tenant_isolation_select" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation_select" ON "audit_logs"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "audit_logs_tenant_isolation_insert" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation_insert" ON "audit_logs"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "audit_logs_tenant_isolation_update" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation_update" ON "audit_logs"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "audit_logs_tenant_isolation_delete" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation_delete" ON "audit_logs"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- GOALS
DROP POLICY IF EXISTS "goals_tenant_isolation_select" ON "goals";
CREATE POLICY "goals_tenant_isolation_select" ON "goals"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "goals_tenant_isolation_insert" ON "goals";
CREATE POLICY "goals_tenant_isolation_insert" ON "goals"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "goals_tenant_isolation_update" ON "goals";
CREATE POLICY "goals_tenant_isolation_update" ON "goals"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "goals_tenant_isolation_delete" ON "goals";
CREATE POLICY "goals_tenant_isolation_delete" ON "goals"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- COURSES
DROP POLICY IF EXISTS "courses_tenant_isolation_select" ON "courses";
CREATE POLICY "courses_tenant_isolation_select" ON "courses"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "courses_tenant_isolation_insert" ON "courses";
CREATE POLICY "courses_tenant_isolation_insert" ON "courses"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "courses_tenant_isolation_update" ON "courses";
CREATE POLICY "courses_tenant_isolation_update" ON "courses"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "courses_tenant_isolation_delete" ON "courses";
CREATE POLICY "courses_tenant_isolation_delete" ON "courses"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- TRAINING_EVENTS
DROP POLICY IF EXISTS "training_events_tenant_isolation_select" ON "training_events";
CREATE POLICY "training_events_tenant_isolation_select" ON "training_events"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "training_events_tenant_isolation_insert" ON "training_events";
CREATE POLICY "training_events_tenant_isolation_insert" ON "training_events"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "training_events_tenant_isolation_update" ON "training_events";
CREATE POLICY "training_events_tenant_isolation_update" ON "training_events"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "training_events_tenant_isolation_delete" ON "training_events";
CREATE POLICY "training_events_tenant_isolation_delete" ON "training_events"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- RESOURCES
DROP POLICY IF EXISTS "resources_tenant_isolation_select" ON "resources";
CREATE POLICY "resources_tenant_isolation_select" ON "resources"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "resources_tenant_isolation_insert" ON "resources";
CREATE POLICY "resources_tenant_isolation_insert" ON "resources"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "resources_tenant_isolation_update" ON "resources";
CREATE POLICY "resources_tenant_isolation_update" ON "resources"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "resources_tenant_isolation_delete" ON "resources";
CREATE POLICY "resources_tenant_isolation_delete" ON "resources"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- PRODUCT_INFO
DROP POLICY IF EXISTS "product_info_tenant_isolation_select" ON "product_info";
CREATE POLICY "product_info_tenant_isolation_select" ON "product_info"
  FOR SELECT
  USING ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "product_info_tenant_isolation_insert" ON "product_info";
CREATE POLICY "product_info_tenant_isolation_insert" ON "product_info"
  FOR INSERT
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "product_info_tenant_isolation_update" ON "product_info";
CREATE POLICY "product_info_tenant_isolation_update" ON "product_info"
  FOR UPDATE
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

DROP POLICY IF EXISTS "product_info_tenant_isolation_delete" ON "product_info";
CREATE POLICY "product_info_tenant_isolation_delete" ON "product_info"
  FOR DELETE
  USING ("tenantId" = current_tenant_id());

-- HELP_ARTICLES (if exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS "help_articles_tenant_isolation_select" ON "help_articles";
  CREATE POLICY "help_articles_tenant_isolation_select" ON "help_articles"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "help_articles_tenant_isolation_insert" ON "help_articles";
  CREATE POLICY "help_articles_tenant_isolation_insert" ON "help_articles"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "help_articles_tenant_isolation_update" ON "help_articles";
  CREATE POLICY "help_articles_tenant_isolation_update" ON "help_articles"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "help_articles_tenant_isolation_delete" ON "help_articles";
  CREATE POLICY "help_articles_tenant_isolation_delete" ON "help_articles"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- FAQS (if exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS "faqs_tenant_isolation_select" ON "faqs";
  CREATE POLICY "faqs_tenant_isolation_select" ON "faqs"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "faqs_tenant_isolation_insert" ON "faqs";
  CREATE POLICY "faqs_tenant_isolation_insert" ON "faqs"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "faqs_tenant_isolation_update" ON "faqs";
  CREATE POLICY "faqs_tenant_isolation_update" ON "faqs"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "faqs_tenant_isolation_delete" ON "faqs";
  CREATE POLICY "faqs_tenant_isolation_delete" ON "faqs"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- SMARTOFFICE TABLES (if exist)
DO $$ BEGIN
  DROP POLICY IF EXISTS "smartoffice_policies_tenant_isolation_select" ON "smartoffice_policies";
  CREATE POLICY "smartoffice_policies_tenant_isolation_select" ON "smartoffice_policies"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_policies_tenant_isolation_insert" ON "smartoffice_policies";
  CREATE POLICY "smartoffice_policies_tenant_isolation_insert" ON "smartoffice_policies"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_policies_tenant_isolation_update" ON "smartoffice_policies";
  CREATE POLICY "smartoffice_policies_tenant_isolation_update" ON "smartoffice_policies"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_policies_tenant_isolation_delete" ON "smartoffice_policies";
  CREATE POLICY "smartoffice_policies_tenant_isolation_delete" ON "smartoffice_policies"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "smartoffice_agents_tenant_isolation_select" ON "smartoffice_agents";
  CREATE POLICY "smartoffice_agents_tenant_isolation_select" ON "smartoffice_agents"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_agents_tenant_isolation_insert" ON "smartoffice_agents";
  CREATE POLICY "smartoffice_agents_tenant_isolation_insert" ON "smartoffice_agents"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_agents_tenant_isolation_update" ON "smartoffice_agents";
  CREATE POLICY "smartoffice_agents_tenant_isolation_update" ON "smartoffice_agents"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_agents_tenant_isolation_delete" ON "smartoffice_agents";
  CREATE POLICY "smartoffice_agents_tenant_isolation_delete" ON "smartoffice_agents"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "smartoffice_sync_logs_tenant_isolation_select" ON "smartoffice_sync_logs";
  CREATE POLICY "smartoffice_sync_logs_tenant_isolation_select" ON "smartoffice_sync_logs"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_sync_logs_tenant_isolation_insert" ON "smartoffice_sync_logs";
  CREATE POLICY "smartoffice_sync_logs_tenant_isolation_insert" ON "smartoffice_sync_logs"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_sync_logs_tenant_isolation_update" ON "smartoffice_sync_logs";
  CREATE POLICY "smartoffice_sync_logs_tenant_isolation_update" ON "smartoffice_sync_logs"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_sync_logs_tenant_isolation_delete" ON "smartoffice_sync_logs";
  CREATE POLICY "smartoffice_sync_logs_tenant_isolation_delete" ON "smartoffice_sync_logs"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "smartoffice_custom_reports_tenant_isolation_select" ON "smartoffice_custom_reports";
  CREATE POLICY "smartoffice_custom_reports_tenant_isolation_select" ON "smartoffice_custom_reports"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_custom_reports_tenant_isolation_insert" ON "smartoffice_custom_reports";
  CREATE POLICY "smartoffice_custom_reports_tenant_isolation_insert" ON "smartoffice_custom_reports"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_custom_reports_tenant_isolation_update" ON "smartoffice_custom_reports";
  CREATE POLICY "smartoffice_custom_reports_tenant_isolation_update" ON "smartoffice_custom_reports"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_custom_reports_tenant_isolation_delete" ON "smartoffice_custom_reports";
  CREATE POLICY "smartoffice_custom_reports_tenant_isolation_delete" ON "smartoffice_custom_reports"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "smartoffice_chat_history_tenant_isolation_select" ON "smartoffice_chat_history";
  CREATE POLICY "smartoffice_chat_history_tenant_isolation_select" ON "smartoffice_chat_history"
    FOR SELECT
    USING ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_chat_history_tenant_isolation_insert" ON "smartoffice_chat_history";
  CREATE POLICY "smartoffice_chat_history_tenant_isolation_insert" ON "smartoffice_chat_history"
    FOR INSERT
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_chat_history_tenant_isolation_update" ON "smartoffice_chat_history";
  CREATE POLICY "smartoffice_chat_history_tenant_isolation_update" ON "smartoffice_chat_history"
    FOR UPDATE
    USING ("tenantId" = current_tenant_id())
    WITH CHECK ("tenantId" = current_tenant_id());

  DROP POLICY IF EXISTS "smartoffice_chat_history_tenant_isolation_delete" ON "smartoffice_chat_history";
  CREATE POLICY "smartoffice_chat_history_tenant_isolation_delete" ON "smartoffice_chat_history"
    FOR DELETE
    USING ("tenantId" = current_tenant_id());
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations', 'cases', 'quotes', 'commissions',
                    'contracts', 'notifications', 'audit_logs', 'goals',
                    'courses', 'training_events', 'resources', 'product_info')
ORDER BY tablename;

-- Check policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
