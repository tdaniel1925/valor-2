-- First, add the new columns to the commissions table if they don't exist
DO $$
BEGIN
  -- Add SmartOffice commission fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='primaryAdvisor') THEN
    ALTER TABLE commissions ADD COLUMN "primaryAdvisor" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='advisorName') THEN
    ALTER TABLE commissions ADD COLUMN "advisorName" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='subSource') THEN
    ALTER TABLE commissions ADD COLUMN "subSource" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='supervisor') THEN
    ALTER TABLE commissions ADD COLUMN "supervisor" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='primaryInsured') THEN
    ALTER TABLE commissions ADD COLUMN "primaryInsured" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='commAnnualizedPrem') THEN
    ALTER TABLE commissions ADD COLUMN "commAnnualizedPrem" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='premiumMode') THEN
    ALTER TABLE commissions ADD COLUMN "premiumMode" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='checkDate') THEN
    ALTER TABLE commissions ADD COLUMN "checkDate" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='statusDate') THEN
    ALTER TABLE commissions ADD COLUMN "statusDate" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commissions' AND column_name='receivable') THEN
    ALTER TABLE commissions ADD COLUMN "receivable" DOUBLE PRECISION;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "commissions_policyNumber_idx" ON commissions("policyNumber");
CREATE INDEX IF NOT EXISTS "commissions_primaryAdvisor_idx" ON commissions("primaryAdvisor");
