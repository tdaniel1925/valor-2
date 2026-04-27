-- FireLight RLS Policies
-- Run this in Supabase SQL Editor

-- Option A: Disable RLS on these tables (simpler, since they're only accessed server-side)
ALTER TABLE firelight_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE firelight_documents DISABLE ROW LEVEL SECURITY;

-- OR Option B: If you prefer RLS enabled, create permissive policies:
-- ALTER TABLE firelight_submissions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for app role" ON firelight_submissions FOR ALL TO valor_app_role USING (true) WITH CHECK (true);
-- ALTER TABLE firelight_documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for app role" ON firelight_documents FOR ALL TO valor_app_role USING (true) WITH CHECK (true);
