# Manual Supabase Schema Setup

Since the local machine cannot connect directly to Supabase, use this guide to manually create the database schema via Supabase Studio.

## Step 1: Access Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/buteoznuikfowbwofabs**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

## Step 2: Copy and Paste the SQL Schema

The complete SQL schema has been generated in `schema.sql`

**IMPORTANT**: Copy the ENTIRE contents of `schema.sql` and paste it into the SQL Editor.

## Step 3: Execute the SQL

1. After pasting the schema, click the **"Run"** button (or press Ctrl+Enter)
2. Wait for execution to complete (~10-30 seconds)
3. You should see a success message

## Step 4: Verify Tables Were Created

1. Click **"Table Editor"** in the left sidebar
2. You should see 26 tables:
   - users
   - user_profiles
   - organizations
   - organization_members
   - contracts
   - quotes
   - cases
   - case_notes
   - commissions
   - notifications
   - audit_logs
   - goals
   - courses
   - lessons
   - enrollments
   - lesson_progress
   - certifications
   - training_events
   - event_attendees
   - resources
   - resource_favorites
   - product_info

## Step 5: Enable Row Level Security (RLS) - OPTIONAL

For security, you may want to enable RLS on sensitive tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these later)
-- Example: Users can only see their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = "userId");
```

**Note**: RLS is optional for now. You can set it up later as needed.

## Quick Copy Section

**SQL Schema Location**: `c:\dev\valor-2\schema.sql`

**How to copy**:
```bash
cat schema.sql
```

Or open `schema.sql` in your editor and copy all contents (758 lines).

## Troubleshooting

### Error: "relation already exists"
This means the tables are already created. You can either:
1. Skip this step (tables are already there)
2. Drop all tables first (be careful - this deletes data!)

To drop all tables:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run the schema.sql again.

### Error: Permission denied
Make sure you're logged into Supabase with the correct account and have access to the project.

---

## After Schema is Created

1. Proceed with Vercel deployment using `VERCEL_DEPLOYMENT_STEPS.md`
2. Your app will be able to connect to the database
3. Test user registration and basic functionality

---

**Project**: buteoznuikfowbwofabs
**Dashboard**: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
**SQL Editor**: https://supabase.com/dashboard/project/buteoznuikfowbwofabs/sql
