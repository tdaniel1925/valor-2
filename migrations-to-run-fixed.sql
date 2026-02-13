-- Step 1: Fix existing commission split data
-- Convert any percentage values (>1) to decimals (0-1)
UPDATE "organization_members"
SET "commissionSplit" = "commissionSplit" / 100
WHERE "commissionSplit" > 1;

-- Set any negative values to NULL
UPDATE "organization_members"
SET "commissionSplit" = NULL
WHERE "commissionSplit" < 0;

-- Step 2: Now add the commission split constraint
ALTER TABLE "organization_members"
ADD CONSTRAINT "commission_split_range"
CHECK ("commissionSplit" IS NULL OR ("commissionSplit" >= 0 AND "commissionSplit" <= 1));

-- Step 3: Data Integrity Constraints

-- Foreign key cascade for cases -> quotes
ALTER TABLE "cases"
DROP CONSTRAINT IF EXISTS "cases_quoteId_fkey";

ALTER TABLE "cases"
ADD CONSTRAINT "cases_quoteId_fkey"
FOREIGN KEY ("quoteId")
REFERENCES "quotes"("id")
ON DELETE SET NULL;

-- Foreign key cascade for commissions -> cases
ALTER TABLE "commissions"
DROP CONSTRAINT IF EXISTS "commissions_caseId_fkey";

ALTER TABLE "commissions"
ADD CONSTRAINT "commissions_caseId_fkey"
FOREIGN KEY ("caseId")
REFERENCES "cases"("id")
ON DELETE SET NULL;

-- Unique constraint for contract numbers
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_contractNumber_unique"
ON "contracts"("contractNumber")
WHERE "contractNumber" IS NOT NULL;

-- Unique constraint for application numbers
CREATE UNIQUE INDEX IF NOT EXISTS "cases_applicationNumber_unique"
ON "cases"("applicationNumber")
WHERE "applicationNumber" IS NOT NULL;

-- Unique constraint for policy numbers
CREATE UNIQUE INDEX IF NOT EXISTS "cases_policyNumber_unique"
ON "cases"("policyNumber")
WHERE "policyNumber" IS NOT NULL;
