-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR NOW
-- This changes status from ENUM to TEXT to accept exact spreadsheet values
-- URL: https://supabase.com/dashboard/project/buteoznuikfowbwofabs/sql/new

BEGIN;

-- Step 1: Add a temporary text column
ALTER TABLE "smartoffice_policies" ADD COLUMN "status_temp" TEXT;

-- Step 2: Copy existing enum values to the text column
UPDATE "smartoffice_policies" SET "status_temp" = "status"::TEXT;

-- Step 3: Drop the old enum column
ALTER TABLE "smartoffice_policies" DROP COLUMN "status";

-- Step 4: Rename the temp column to status
ALTER TABLE "smartoffice_policies" RENAME COLUMN "status_temp" TO "status";

-- Step 5: Set default value
ALTER TABLE "smartoffice_policies" ALTER COLUMN "status" SET DEFAULT 'Unknown';

-- Step 6: Drop the enum type (it's no longer needed)
DROP TYPE IF EXISTS "SmartOfficePolicyStatus" CASCADE;

COMMIT;

-- ✅ After running this, the status column will accept ANY text value
-- ✅ Re-upload your spreadsheet to see exact statuses like "Approved - Awaiting Reqs"
