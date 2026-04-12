import { PrismaClient } from '@prisma/client';

// Create a new Prisma client with direct connection
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function addMissingColumns() {
  console.log('Adding missing billing columns to tenants table...\n');

  try {
    // Add stripeCustomerId
    console.log('Adding stripeCustomerId...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'stripeCustomerId'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "stripeCustomerId" TEXT;
              CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON public.tenants("stripeCustomerId");
              RAISE NOTICE 'Added stripeCustomerId column';
          ELSE
              RAISE NOTICE 'stripeCustomerId column already exists';
          END IF;
      END $$;
    `);

    // Add stripeSubscriptionId
    console.log('Adding stripeSubscriptionId...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'stripeSubscriptionId'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "stripeSubscriptionId" TEXT;
              CREATE UNIQUE INDEX "tenants_stripeSubscriptionId_key" ON public.tenants("stripeSubscriptionId");
              RAISE NOTICE 'Added stripeSubscriptionId column';
          ELSE
              RAISE NOTICE 'stripeSubscriptionId column already exists';
          END IF;
      END $$;
    `);

    // Add stripePriceId
    console.log('Adding stripePriceId...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'stripePriceId'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "stripePriceId" TEXT;
              RAISE NOTICE 'Added stripePriceId column';
          ELSE
              RAISE NOTICE 'stripePriceId column already exists';
          END IF;
      END $$;
    `);

    // Add subscriptionStatus
    console.log('Adding subscriptionStatus...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'subscriptionStatus'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "subscriptionStatus" TEXT;
              RAISE NOTICE 'Added subscriptionStatus column';
          ELSE
              RAISE NOTICE 'subscriptionStatus column already exists';
          END IF;
      END $$;
    `);

    // Add currentPeriodEnd
    console.log('Adding currentPeriodEnd...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'currentPeriodEnd'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
              RAISE NOTICE 'Added currentPeriodEnd column';
          ELSE
              RAISE NOTICE 'currentPeriodEnd column already exists';
          END IF;
      END $$;
    `);

    // Add cancelAtPeriodEnd
    console.log('Adding cancelAtPeriodEnd...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'cancelAtPeriodEnd'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
              RAISE NOTICE 'Added cancelAtPeriodEnd column';
          ELSE
              RAISE NOTICE 'cancelAtPeriodEnd column already exists';
          END IF;
      END $$;
    `);

    // Add maxUsers
    console.log('Adding maxUsers...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'maxUsers'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 5;
              RAISE NOTICE 'Added maxUsers column';
          ELSE
              RAISE NOTICE 'maxUsers column already exists';
          END IF;
      END $$;
    `);

    // Add maxStorageGB
    console.log('Adding maxStorageGB...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'tenants'
              AND column_name = 'maxStorageGB'
          ) THEN
              ALTER TABLE public.tenants ADD COLUMN "maxStorageGB" INTEGER NOT NULL DEFAULT 10;
              RAISE NOTICE 'Added maxStorageGB column';
          ELSE
              RAISE NOTICE 'maxStorageGB column already exists';
          END IF;
      END $$;
    `);

    console.log('\n✅ Migration complete!');
    console.log('\nVerifying columns...');

    const result: any = await prisma.$queryRawUnsafe(`
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
    `);

    console.log('\nAdded columns:');
    console.table(result);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();
