-- SmartOffice Phase 1 Database Migration
-- Apply this SQL in Supabase Dashboard > SQL Editor

-- 1. Create SmartOfficeImport audit trail table
CREATE TABLE IF NOT EXISTS "smartoffice_imports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "importMode" TEXT NOT NULL DEFAULT 'REPLACE',
  "recordsTotal" INTEGER NOT NULL DEFAULT 0,
  "recordsCreated" INTEGER NOT NULL DEFAULT 0,
  "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
  "recordsFailed" INTEGER NOT NULL DEFAULT 0,
  "validationErrors" JSONB,
  "validationWarnings" JSONB,
  "processingErrors" JSONB,
  "columnMapping" JSONB,
  "fileUrl" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "smartoffice_imports_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "smartoffice_imports_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Create indexes for smartoffice_imports
CREATE INDEX IF NOT EXISTS "smartoffice_imports_tenantId_idx" ON "smartoffice_imports"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_imports_userId_idx" ON "smartoffice_imports"("userId");
CREATE INDEX IF NOT EXISTS "smartoffice_imports_status_idx" ON "smartoffice_imports"("status");
CREATE INDEX IF NOT EXISTS "smartoffice_imports_source_idx" ON "smartoffice_imports"("source");
CREATE INDEX IF NOT EXISTS "smartoffice_imports_startedAt_idx" ON "smartoffice_imports"("startedAt");

-- 3. Add importId column to smartoffice_policies
ALTER TABLE "smartoffice_policies"
  ADD COLUMN IF NOT EXISTS "importId" TEXT;

-- 4. Add foreign key constraint for importId on policies
ALTER TABLE "smartoffice_policies"
  ADD CONSTRAINT "smartoffice_policies_importId_fkey"
    FOREIGN KEY ("importId") REFERENCES "smartoffice_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Create index for importId on policies
CREATE INDEX IF NOT EXISTS "smartoffice_policies_importId_idx" ON "smartoffice_policies"("importId");

-- 6. Add importId column to smartoffice_agents
ALTER TABLE "smartoffice_agents"
  ADD COLUMN IF NOT EXISTS "importId" TEXT;

-- 7. Add foreign key constraint for importId on agents
ALTER TABLE "smartoffice_agents"
  ADD CONSTRAINT "smartoffice_agents_importId_fkey"
    FOREIGN KEY ("importId") REFERENCES "smartoffice_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Create index for importId on agents
CREATE INDEX IF NOT EXISTS "smartoffice_agents_importId_idx" ON "smartoffice_agents"("importId");

-- Verification queries (run after migration):
-- SELECT COUNT(*) FROM smartoffice_imports; -- Should work without error
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'smartoffice_policies' AND column_name = 'importId'; -- Should return 'importId'
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'smartoffice_agents' AND column_name = 'importId'; -- Should return 'importId'
