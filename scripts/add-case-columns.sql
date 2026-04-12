-- Simple column additions that don't require owner permissions
-- Run this in Supabase SQL Editor

-- Add new columns from Excel (these should work without owner permissions)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryAdvisor" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryInsured" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "targetAmount" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "commAnnualizedPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "weightedPremium" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "excessPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "statusDate" TIMESTAMP(3);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add index for policy number lookups
CREATE INDEX IF NOT EXISTS "cases_policyNumber_idx" ON cases("policyNumber");

SELECT 'Migration completed - new columns added' as status;
