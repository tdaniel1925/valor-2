-- FireLight Integration Tables
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add firelightAgentId to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "firelightAgentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_firelightAgentId_key" ON "user_profiles"("firelightAgentId");

-- 2. Create firelight_submissions table
CREATE TABLE IF NOT EXISTS "firelight_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "dti" TEXT,
    "caseId" TEXT,
    "matchedUserId" TEXT,
    "agentFirstName" TEXT,
    "agentLastName" TEXT,
    "agentSsn" TEXT,
    "agentIdNumber" TEXT,
    "clientFirstName" TEXT,
    "clientLastName" TEXT,
    "clientDob" TEXT,
    "clientEmail" TEXT,
    "clientSsn" TEXT,
    "productName" TEXT,
    "productType" TEXT,
    "investmentAmount" DOUBLE PRECISION,
    "rawXml" TEXT,
    "extractedFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "sourceEnvironment" TEXT,
    "sourceFileName" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firelight_submissions_pkey" PRIMARY KEY ("id")
);

-- 3. Create firelight_documents table
CREATE TABLE IF NOT EXISTS "firelight_documents" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "formName" TEXT,
    "fileName" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firelight_documents_pkey" PRIMARY KEY ("id")
);

-- 4. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "firelight_submissions_transactionId_key" ON "firelight_submissions"("transactionId");
CREATE INDEX IF NOT EXISTS "firelight_submissions_tenantId_idx" ON "firelight_submissions"("tenantId");
CREATE INDEX IF NOT EXISTS "firelight_submissions_transactionId_idx" ON "firelight_submissions"("transactionId");
CREATE INDEX IF NOT EXISTS "firelight_submissions_applicationId_idx" ON "firelight_submissions"("applicationId");
CREATE INDEX IF NOT EXISTS "firelight_submissions_status_idx" ON "firelight_submissions"("status");
CREATE INDEX IF NOT EXISTS "firelight_submissions_caseId_idx" ON "firelight_submissions"("caseId");
CREATE INDEX IF NOT EXISTS "firelight_documents_submissionId_idx" ON "firelight_documents"("submissionId");

-- 5. Foreign keys
ALTER TABLE "firelight_submissions" ADD CONSTRAINT "firelight_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "firelight_submissions" ADD CONSTRAINT "firelight_submissions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "firelight_documents" ADD CONSTRAINT "firelight_documents_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "firelight_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Grant permissions to app role
GRANT ALL ON "firelight_submissions" TO valor_app_role;
GRANT ALL ON "firelight_documents" TO valor_app_role;
