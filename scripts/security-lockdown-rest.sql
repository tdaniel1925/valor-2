-- ============================================================
-- SECURITY LOCKDOWN — seal the Supabase PostgREST (REST API) surface
--
-- ⚠️ MUST be run in the SUPABASE SQL EDITOR (it runs as a privileged role).
-- The app DB role (valor_app_role) CANNOT remove these grants because they were
-- made by `postgres` — a non-owner REVOKE silently no-ops. Confirmed 2026-06-23.
--
-- WHY: every table is in `public`, which Supabase exposes over its REST API
-- gated only by the `anon`/`authenticated`/`service_role` roles + RLS. This app
-- does NOT use REST for data — it uses Prisma as `valor_app_role`, and Supabase
-- only for Auth. With RLS off, the public anon key (shipped to every browser)
-- could read ALL tables (agents, policies, users, commissions, SSNs). This
-- revokes that REST access entirely; Prisma (valor_app_role) is untouched.
--
-- SOC 2 (CC6.1 least privilege): remove all data privileges from the
-- internet-facing roles AND lock DEFAULT privileges so FUTURE tables stay
-- closed — no per-table RLS to maintain, no regression on the next migration.
-- Idempotent / safe to re-run.
-- ============================================================

-- 1. Revoke ALL privileges on existing public objects from the REST roles.
--    (service_role is the privileged backend role; if any server code uses the
--     service key for table reads, keep it — but this app uses it only for
--     auth admin + storage, so revoking table data access is safe. If a later
--     check shows service_role is needed for a table, re-grant that table only.)
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2. Remove schema USAGE so PostgREST can't even resolve table names.
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 3. Lock DEFAULT privileges so FUTURE objects are not auto-granted to the REST
--    roles. Supabase's default-privilege grants are made by `postgres`, so this
--    must alter the defaults FOR ROLE postgres (and supabase_admin) to stick.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

DO $$
BEGIN
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip supabase_admin default-privs: %', SQLERRM;
END $$;

-- 4. Ensure Prisma's role keeps full access (it is distinct from the REST roles).
GRANT USAGE ON SCHEMA public TO valor_app_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO valor_app_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO valor_app_role;

-- 5. Tell PostgREST to reload so the revoked grants take effect immediately.
NOTIFY pgrst, 'reload schema';

-- 6. VERIFY (run after; expect ZERO rows):
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema='public' AND grantee IN ('anon','authenticated');
--
--   And raw ACL on a sample table (expect NO 'anon=' / 'authenticated=' items):
--   SELECT unnest(relacl)::text FROM pg_class WHERE relname='smartoffice_agents';
