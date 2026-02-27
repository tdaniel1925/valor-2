# Multi-Tenant Foundation - Migration Instructions

## Status: Code Complete ✅ | Database Pending ⏳

All code for Phase 1 (Multi-Tenant Foundation) has been written and is compiling successfully. However, the database migrations could not be applied because the Supabase database is currently unreachable.

---

## What Was Built

### ✅ Phase 1A: Database Schema
- **Tenant Model**: Created with TenantStatus enum (ACTIVE, TRIAL, SUSPENDED, CHURNED)
- **18 Core Models Updated**: Added `tenantId` foreign key to:
  - User, Organization, Contract, Quote, Case, Commission
  - Notification, AuditLog, Goal, Course, TrainingEvent
  - Resource, ProductInfo, HelpArticle, FAQ
  - SmartOfficePolicy, SmartOfficeAgent, SmartOfficeSyncLog
  - SmartOfficeCustomReport, SmartOfficeChatHistory

### ✅ Phase 1B: Row Level Security
- **RLS Policies**: Created for all 20 tenant-scoped tables
- **Session Variable**: Uses `app.current_tenant_id` for enforcement
- **Database-Level Isolation**: Prevents cross-tenant queries at PostgreSQL level

### ✅ Phase 1C: Middleware
- **Tenant Resolution**: Extracts subdomain and fetches tenant from database
- **Request Headers**: Injects `x-tenant-id`, `x-tenant-slug`, etc.
- **Error Handling**: Redirects to appropriate error pages

### ✅ Phase 1D: API Route Utilities
- **Tenant Context Helpers**: Extract tenant from request headers
- **Tenant-Scoped Prisma**: Automatically apply RLS context
- **Validation Functions**: Verify resource access permissions

### ✅ Phase 1E: Error Pages
- **`/no-tenant`**: For root domain visits without subdomain
- **`/tenant-not-found`**: For invalid/inactive subdomains
- **`/unauthorized`**: For cross-tenant access attempts

---

## When Database Becomes Accessible

### Step 1: Verify Database Connection

```bash
# Test connection
npx prisma db pull

# Should see: "Prisma schema loaded from prisma\schema.prisma"
# If you see P1001 error, database is still unreachable
```

### Step 2: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/buteoznuikfowbwofabs
2. Navigate to: **Settings** → **Database**
3. Verify:
   - ✅ Database is not paused
   - ✅ Your IP address is allowed (if IP restrictions enabled)
   - ✅ Connection pooler is healthy

### Step 3: Apply Migrations

**Option A: Use `db push` (Recommended for Development)**

```bash
npx prisma db push
```

This will:
- Create the `tenants` table
- Add `tenantId` columns to all tables with DEFAULT 'TEMP_TENANT_ID'
- Create indexes
- Add foreign key constraints

**Option B: Use `migrate deploy` (For Production)**

```bash
npx prisma migrate deploy
```

This applies the migration files we created in:
- `prisma/migrations/20260227112310_add_multi_tenancy/migration.sql`
- `prisma/migrations/20260227112311_add_rls_policies/migration.sql`

### Step 4: Create Default Tenant

After migration succeeds, you MUST create a default tenant for existing data:

```sql
-- Connect to database via Supabase SQL Editor or psql
INSERT INTO tenants (
  id,
  name,
  slug,
  "emailSlug",
  "emailVerified",
  status,
  "createdAt",
  "updatedAt"
)
VALUES (
  'default-tenant-id',
  'Default Agency',
  'default',
  'default@reports.valorfs.app',
  false,
  'ACTIVE',
  NOW(),
  NOW()
);
```

### Step 5: Update Existing Data

Point all existing records to the default tenant:

```sql
-- Update all tenant-scoped tables
UPDATE users SET "tenantId" = 'default-tenant-id';
UPDATE organizations SET "tenantId" = 'default-tenant-id';
UPDATE contracts SET "tenantId" = 'default-tenant-id';
UPDATE quotes SET "tenantId" = 'default-tenant-id';
UPDATE cases SET "tenantId" = 'default-tenant-id';
UPDATE commissions SET "tenantId" = 'default-tenant-id';
UPDATE notifications SET "tenantId" = 'default-tenant-id';
UPDATE audit_logs SET "tenantId" = 'default-tenant-id';
UPDATE goals SET "tenantId" = 'default-tenant-id';
UPDATE courses SET "tenantId" = 'default-tenant-id';
UPDATE training_events SET "tenantId" = 'default-tenant-id';
UPDATE resources SET "tenantId" = 'default-tenant-id';
UPDATE product_info SET "tenantId" = 'default-tenant-id';
UPDATE help_articles SET "tenantId" = 'default-tenant-id';
UPDATE faqs SET "tenantId" = 'default-tenant-id';

-- For SmartOffice tables (if they exist)
UPDATE smartoffice_policies SET "tenantId" = 'default-tenant-id';
UPDATE smartoffice_agents SET "tenantId" = 'default-tenant-id';
UPDATE smartoffice_sync_logs SET "tenantId" = 'default-tenant-id';
UPDATE smartoffice_custom_reports SET "tenantId" = 'default-tenant-id';
UPDATE smartoffice_chat_history SET "tenantId" = 'default-tenant-id';
```

### Step 6: Remove Default Values

Once all data is migrated, remove the temporary defaults:

```sql
-- Remove DEFAULT constraint from all tables
ALTER TABLE users ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE organizations ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE contracts ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE quotes ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE cases ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE commissions ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE notifications ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE audit_logs ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE goals ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE courses ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE training_events ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE resources ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE product_info ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE help_articles ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE faqs ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE smartoffice_policies ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE smartoffice_agents ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE smartoffice_sync_logs ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE smartoffice_custom_reports ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE smartoffice_chat_history ALTER COLUMN "tenantId" DROP DEFAULT;
```

### Step 7: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 8: Test Multi-Tenancy

```bash
# 1. Start dev server (should already be running)
npm run dev

# 2. Add test subdomains to hosts file
# Windows: C:\Windows\System32\drivers\etc\hosts
# macOS/Linux: /etc/hosts
127.0.0.1  default.localhost
127.0.0.1  test-agency.localhost

# 3. Visit in browser
http://default.localhost:2050/dashboard
```

---

## Verification Checklist

After applying migrations, verify:

- [ ] `tenants` table exists in database
- [ ] All 20 tables have `tenantId` column
- [ ] Foreign key constraints are created
- [ ] Indexes on `tenantId` exist
- [ ] RLS is enabled on all tables
- [ ] RLS policies are created
- [ ] Default tenant record exists
- [ ] All existing data points to default tenant
- [ ] Prisma Client regenerated
- [ ] Dev server compiles without errors
- [ ] Middleware resolves tenant from subdomain
- [ ] Error pages accessible (`/no-tenant`, `/tenant-not-found`, `/unauthorized`)

---

## Current File Structure

```
C:\dev\valor-2\
├── lib/
│   ├── auth/
│   │   ├── tenant-context.ts          ✅ Created
│   │   └── get-tenant-context.ts      ✅ Created
│   └── db/
│       └── tenant-scoped-prisma.ts    ✅ Created
├── app/
│   ├── no-tenant/
│   │   └── page.tsx                   ✅ Created
│   ├── tenant-not-found/
│   │   └── page.tsx                   ✅ Created
│   └── unauthorized/
│       └── page.tsx                   ✅ Created
├── middleware.ts                       ✅ Updated
├── prisma/
│   ├── schema.prisma                  ✅ Updated (Tenant model + 18 models)
│   └── migrations/
│       ├── 20260227112310_add_multi_tenancy/
│       │   └── migration.sql          ✅ Ready to apply
│       └── 20260227112311_add_rls_policies/
│           └── migration.sql          ✅ Ready to apply
└── .env                               ✅ Temporary (DATABASE_URL set)
```

---

## Next Steps After Migration

1. **Update API Routes**: Add tenant scoping to ~15 high-priority routes
2. **Write Tests**:
   - Unit tests for tenant context (Vitest)
   - E2E tests for tenant isolation (Playwright)
3. **Manual Testing**: Test subdomain resolution and data isolation
4. **Documentation**: Update README with multi-tenant setup instructions

---

## Troubleshooting

### Database Still Unreachable

**Issue**: `P1001: Can't reach database server`

**Solutions**:
1. Check if database is paused in Supabase dashboard
2. Verify IP allowlist (Settings → Database → Connection Pooling)
3. Try direct connection instead of pooler (port 5432 not 6543)
4. Wait 2-3 minutes for database to wake from pause

### Migration Fails

**Issue**: Migration errors during `db push`

**Solutions**:
1. Check for existing data conflicts
2. Manually create tenant record first
3. Use `prisma migrate reset` (⚠️ deletes all data)
4. Apply migration files manually via SQL

### RLS Not Working

**Issue**: Can query across tenants after migration

**Solutions**:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check policies exist: `SELECT * FROM pg_policies;`
3. Ensure `app.current_tenant_id` is set before queries
4. Verify using non-superuser database role

---

## Contact

If you encounter issues during migration:
- Review `_BUILD/PROMPT-FEATURE-1.md` for detailed specifications
- Check Prisma logs: `npx prisma db push --help`
- Verify Supabase status: https://status.supabase.com/

**Last Updated**: 2026-02-27 (Database migrations pending)
