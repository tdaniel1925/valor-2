# Apply Multi-Tenant Database Migration

## Problem

You encountered this error when trying to apply the migration:
```
ERROR: 42P01: relation "help_articles" does not exist
```

This means the base database tables haven't been created yet. We need to create ALL tables from scratch with multi-tenant support built in.

## Solution: Use Complete Database Setup SQL

I've created a comprehensive SQL file that creates everything from scratch:
**`C:\dev\valor-2\complete-database-setup.sql`**

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
2. Navigate to: **SQL Editor** (in left sidebar)
3. Click **New query**

### 2. Run the Complete Database Setup

1. Open the file: `C:\dev\valor-2\complete-database-setup.sql`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)
4. Go back to Supabase SQL Editor
5. Paste into the query editor (Ctrl+V)
6. Click **Run** button (or press Ctrl+Enter)

### 3. What This SQL Does

The script will automatically:

✅ Create ALL enums (TenantStatus, UserRole, CaseStatus, etc.)
✅ Create ALL 25+ tables with tenantId columns already included
✅ Create ALL indexes for query performance
✅ Add ALL foreign key constraints with CASCADE delete
✅ Create default tenant: `'valor-default-tenant'`
✅ Link any existing data to the default tenant
✅ Handle tables that may already exist (uses `IF NOT EXISTS`)

**Safe to re-run**: The SQL uses `CREATE TABLE IF NOT EXISTS` and `DROP CONSTRAINT IF EXISTS`, so it won't fail if some tables already exist.

### 4. Verify Migration Success

After the SQL completes, verify in Supabase Dashboard:

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - tenants
   - users
   - organizations
   - cases
   - quotes
   - commissions
   - contracts
   - help_articles
   - faqs
   - product_info
   - courses
   - training_events
   - resources
   - smartoffice_policies
   - smartoffice_agents
   - And more...

3. Click on **tenants** table
4. You should see 1 record: `'valor-default-tenant'`

5. Click on **users** table (or any other table)
6. You should see a `tenantId` column

### 5. Regenerate Prisma Client

Back in your terminal, run:

```bash
npx prisma generate
```

This syncs the Prisma client with your new database structure.

### 6. Test the Application

```bash
# Dev server should already be running at port 2050
# If not, start it:
npm run dev
```

Visit: http://localhost:2050

For multi-tenant testing, add to your hosts file:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Add: `127.0.0.1  valor.localhost`

Then visit: http://valor.localhost:2050

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution**: The default tenant already exists. This is fine - the SQL uses `ON CONFLICT DO NOTHING` to handle this gracefully.

### Error: "column tenantId does not exist"
**Solution**: Some tables were created but not all. Re-run the complete SQL script - it's designed to be idempotent (safe to run multiple times).

### Error: "syntax error at or near"
**Solution**: Make sure you copied the ENTIRE SQL file. It's a long file (~700 lines). Scroll to the bottom to verify you got everything.

### Still seeing P1001 connection errors via Prisma CLI?
**Solution**: That's OK - the database is accessible via the Supabase Dashboard SQL Editor, which is all you need for this migration. The CLI connection issues are related to pooler authentication and don't affect the dashboard access.

---

## What's Next?

After successful migration:

1. ✅ Database schema is complete
2. ✅ Multi-tenancy is enabled
3. 🔄 Next: Apply RLS (Row Level Security) policies
4. 🔄 Next: Update API routes with tenant scoping
5. 🔄 Next: Write tests for tenant isolation

See `_BUILD/MIGRATION-INSTRUCTIONS.md` for the full roadmap.

---

## Quick Reference

**Migration SQL File**: `C:\dev\valor-2\complete-database-setup.sql`
**Supabase Dashboard**: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
**Default Tenant ID**: `valor-default-tenant`
**Default Tenant Slug**: `valor`

**Last Updated**: 2026-02-27 18:16 UTC
