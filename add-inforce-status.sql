-- Add INFORCE status to SmartOfficePolicyStatus enum
-- Run this in Supabase SQL Editor as postgres user

-- Add the new enum value
ALTER TYPE "SmartOfficePolicyStatus" ADD VALUE IF NOT EXISTS 'INFORCE';

-- Note: In PostgreSQL, enum values are added to the end by default.
-- If you need a specific order, you would need to recreate the enum and all dependent columns,
-- but that's not necessary for functionality - only for display order in some tools.
