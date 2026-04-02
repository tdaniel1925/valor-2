-- Add SmartOffice commission fields to commissions table
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "primaryAdvisor" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "advisorName" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "subSource" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "supervisor" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "primaryInsured" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "commAnnualizedPrem" DOUBLE PRECISION;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "premiumMode" TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "checkDate" TIMESTAMP(3);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "statusDate" TIMESTAMP(3);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "receivable" DOUBLE PRECISION;

-- Add indexes
CREATE INDEX IF NOT EXISTS "commissions_policyNumber_idx" ON commissions("policyNumber");
CREATE INDEX IF NOT EXISTS "commissions_primaryAdvisor_idx" ON commissions("primaryAdvisor");
