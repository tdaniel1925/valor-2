-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================
-- Location: https://supabase.com/dashboard/project/buteoznuikfowbwofabs/sql/new
--
-- This adds the missing billing columns needed for tests to work
-- Safe to run multiple times (checks if columns exist first)
-- ============================================

-- Add stripeCustomerId
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;

-- Add stripeSubscriptionId
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT UNIQUE;

-- Add stripePriceId
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;

-- Add subscriptionStatus
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;

-- Add currentPeriodEnd
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

-- Add cancelAtPeriodEnd
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- Add maxUsers
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER NOT NULL DEFAULT 5;

-- Add maxStorageGB
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS "maxStorageGB" INTEGER NOT NULL DEFAULT 10;

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tenants'
AND column_name IN (
    'stripeCustomerId',
    'stripeSubscriptionId',
    'stripePriceId',
    'subscriptionStatus',
    'currentPeriodEnd',
    'cancelAtPeriodEnd',
    'maxUsers',
    'maxStorageGB'
)
ORDER BY column_name;
