-- Migration: Update cases table for SmartOffice import
-- Add new columns needed for Excel import

-- Make userId nullable (cases may not be assigned yet)
ALTER TABLE cases ALTER COLUMN "userId" DROP NOT NULL;

-- Make existing string columns nullable
ALTER TABLE cases ALTER COLUMN carrier DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "productType" DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "productName" DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "clientName" DROP NOT NULL;

-- Add new columns from Excel
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryAdvisor" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryInsured" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "targetAmount" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "commAnnualizedPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "weightedPremium" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "excessPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "statusDate" TIMESTAMP(3);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Change status from enum to text
ALTER TABLE cases ALTER COLUMN status TYPE TEXT;
ALTER TABLE cases ALTER COLUMN status DROP NOT NULL;

-- Make policyNumber NOT NULL (it's our primary identifier)
UPDATE cases SET "policyNumber" = id WHERE "policyNumber" IS NULL;
ALTER TABLE cases ALTER COLUMN "policyNumber" SET NOT NULL;

-- Add unique constraint for tenantId + policyNumber
CREATE UNIQUE INDEX IF NOT EXISTS "cases_tenantId_policyNumber_key"
  ON cases("tenantId", "policyNumber");

-- Add index for policyNumber lookups
CREATE INDEX IF NOT EXISTS "cases_policyNumber_idx" ON cases("policyNumber");

-- Drop the old CaseStatus enum if it exists (may fail if still in use, that's ok)
-- DROP TYPE IF EXISTS "CaseStatus" CASCADE;

COMMENT ON COLUMN cases.requirements IS 'All requirements text from SmartOffice Column N - includes line breaks and completion status';
COMMENT ON COLUMN cases."primaryAdvisor" IS 'Agent/Advisor name from SmartOffice';
COMMENT ON COLUMN cases."primaryInsured" IS 'Client name from SmartOffice';
COMMENT ON COLUMN cases."commAnnualizedPrem" IS 'Annualized Premium from SmartOffice';
COMMENT ON COLUMN cases."weightedPremium" IS 'Weighted Premium calculation';
COMMENT ON COLUMN cases."excessPrem" IS 'Excess premium amount';
COMMENT ON COLUMN cases."targetAmount" IS 'Target coverage/investment amount';
COMMENT ON COLUMN cases."statusDate" IS 'Status date from SmartOffice';
