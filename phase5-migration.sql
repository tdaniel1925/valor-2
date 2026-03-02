-- Phase 5 Migration: Add PolicyNote, SavedFilter, and DashboardLayout tables

-- Create policy_notes table
CREATE TABLE IF NOT EXISTS "policy_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "policy_notes_tenantId_policyId_idx" ON "policy_notes"("tenantId", "policyId");
CREATE INDEX IF NOT EXISTS "policy_notes_userId_idx" ON "policy_notes"("userId");

ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "smartoffice_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_notes" ADD CONSTRAINT "policy_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create saved_filters table
CREATE TABLE IF NOT EXISTS "saved_filters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_filters_tenantId_userId_idx" ON "saved_filters"("tenantId", "userId");

ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS "dashboard_layouts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dashboard_layouts_tenantId_userId_idx" ON "dashboard_layouts"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "dashboard_layouts_isDefault_idx" ON "dashboard_layouts"("isDefault");

ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS on new tables
ALTER TABLE "policy_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_filters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dashboard_layouts" ENABLE ROW LEVEL SECURITY;

-- RLS policies for policy_notes
CREATE POLICY "policy_notes_tenant_isolation" ON "policy_notes"
    USING ("tenantId" = current_setting('app.current_tenant_id')::text);

-- RLS policies for saved_filters
CREATE POLICY "saved_filters_tenant_isolation" ON "saved_filters"
    USING ("tenantId" = current_setting('app.current_tenant_id')::text);

-- RLS policies for dashboard_layouts
CREATE POLICY "dashboard_layouts_tenant_isolation" ON "dashboard_layouts"
    USING ("tenantId" = current_setting('app.current_tenant_id')::text);
