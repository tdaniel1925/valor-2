-- Add missing billing columns to tenants table
-- Safe to run multiple times (uses IF NOT EXISTS checks)

-- Add stripeCustomerId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'stripeCustomerId'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "stripeCustomerId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "tenants_stripeCustomerId_key" ON public.tenants("stripeCustomerId");
    END IF;
END $$;

-- Add stripeSubscriptionId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'stripeSubscriptionId'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "stripeSubscriptionId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "tenants_stripeSubscriptionId_key" ON public.tenants("stripeSubscriptionId");
    END IF;
END $$;

-- Add stripePriceId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'stripePriceId'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "stripePriceId" TEXT;
    END IF;
END $$;

-- Add subscriptionStatus if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'subscriptionStatus'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "subscriptionStatus" TEXT;
    END IF;
END $$;

-- Add currentPeriodEnd if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'currentPeriodEnd'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
    END IF;
END $$;

-- Add cancelAtPeriodEnd if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'cancelAtPeriodEnd'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add maxUsers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'maxUsers'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 5;
    END IF;
END $$;

-- Add maxStorageGB if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
        AND column_name = 'maxStorageGB'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN "maxStorageGB" INTEGER NOT NULL DEFAULT 10;
    END IF;
END $$;

-- Verification query
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
