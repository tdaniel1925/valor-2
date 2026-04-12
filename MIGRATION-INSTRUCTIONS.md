# Cases Table Migration Instructions

## Overview
We need to update the Cases table to support importing data from the SmartOffice Excel file "Valor - Cases for 2026 with Requirements.xlsx".

## Step 1: Run SQL Migration in Supabase Dashboard

The database user doesn't have owner permissions on the cases table, so you need to run this SQL in the **Supabase SQL Editor** (with authenticated/owner access):

```sql
-- Add new columns from SmartOffice Excel
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryAdvisor" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "primaryInsured" TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "targetAmount" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "commAnnualizedPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "weightedPremium" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "excessPrem" DOUBLE PRECISION;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS "statusDate" TIMESTAMP(3);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Make userId nullable (cases from Excel may not have assigned users yet)
ALTER TABLE cases ALTER COLUMN "userId" DROP NOT NULL;

-- Make other columns nullable
ALTER TABLE cases ALTER COLUMN carrier DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "productType" DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "productName" DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN "clientName" DROP NOT NULL;

-- Convert status from enum to TEXT to support SmartOffice status values
ALTER TABLE cases ALTER COLUMN status DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN status TYPE TEXT;

-- Ensure policyNumber is NOT NULL and has unique constraint
UPDATE cases SET "policyNumber" = id WHERE "policyNumber" IS NULL;
ALTER TABLE cases ALTER COLUMN "policyNumber" SET NOT NULL;

-- Add unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "cases_tenantId_policyNumber_key"
  ON cases("tenantId", "policyNumber");
CREATE INDEX IF NOT EXISTS "cases_policyNumber_idx" ON cases("policyNumber");

-- Add helpful comments
COMMENT ON COLUMN cases.requirements IS 'All requirements text from SmartOffice Column N - includes line breaks and completion status';
COMMENT ON COLUMN cases."primaryAdvisor" IS 'Agent/Advisor name from SmartOffice';
COMMENT ON COLUMN cases."primaryInsured" IS 'Client name from SmartOffice';

SELECT 'Migration completed successfully!' as status;
```

## Step 2: Generate Prisma Client

After running the SQL migration, regenerate the Prisma client:

```bash
npx prisma generate
```

## Step 3: Import Excel Data

Once the migration is complete, run the import script:

```bash
npx tsx scripts/import-cases-from-excel.ts
```

## Excel File Structure

The Excel file "Valor - Cases for 2026 with Requirements.xlsx" contains:
- **Sheet**: "Dynamic Report - Valor - All ~"
- **Row 2**: Headers
- **Row 3+**: Data (336 rows)

### Column Mapping:
- **Column B** (Policy #) → policyNumber
- **Column C** (Primary Advisor) → primaryAdvisor
- **Column D** (Product Name) → productName
- **Column E** (Carrier Name) → carrier
- **Column F** (Primary Insured) → primaryInsured
- **Column G** (Status Date) → statusDate
- **Column H** (Type) → type
- **Column I** (Target Amount) → targetAmount
- **Column J** (Comm Annualized Prem) → commAnnualizedPrem
- **Column K** (Weighted Premium) → weightedPremium
- **Column L** (Excess Prem) → excessPrem
- **Column M** (Status) → status
- **Column N** (All Requirements) → requirements

## Expected Status Values from SmartOffice

Instead of the previous enum (DRAFT, SUBMITTED, etc.), we now support actual SmartOffice status values like:
- Pending
- Inforce
- Issued
- Not Taken
- etc.

## Requirements Field

Column N contains detailed requirements text with line breaks, including:
- Requirement descriptions
- Completion status (Completed/Pending)
- Completion dates
- Notes and updates

This will be displayed as a bulleted list in the Cases detail page.

## Next Steps After Migration

1. Update the Cases page UI to display the new fields
2. Remove "Import" and "Sync" buttons (data comes from Excel)
3. Remove "Raw Data" section from details page
4. Add "Requirements" card to details page showing parsed requirements as bulleted list
