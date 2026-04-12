import { prisma } from '@/lib/db/prisma';
import { createClient } from '@supabase/supabase-js';

/**
 * Test tenant configurations
 */
export const TEST_TENANTS = {
  TENANT_A: {
    slug: 'test-agency-a',
    subdomain: 'test-agency-a', // Same as slug for subdomain routing
    name: 'Test Agency A',
    email: 'admin@test-agency-a.com',
    password: 'TestPassword123!',
  },
  TENANT_B: {
    slug: 'test-agency-b',
    subdomain: 'test-agency-b', // Same as slug for subdomain routing
    name: 'Test Agency B',
    email: 'admin@test-agency-b.com',
    password: 'TestPassword123!',
  },
};

/**
 * Creates test tenants and users for E2E testing
 * Safe to run multiple times - checks if tenants already exist
 */
export async function createTestTenants() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    tenantsCreated: [] as string[],
    usersCreated: [] as string[],
    errors: [] as string[],
  };

  for (const [key, config] of Object.entries(TEST_TENANTS)) {
    try {
      // Check if tenant already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: config.slug },
      });

      let tenantId: string;

      if (existingTenant) {
        console.log(`✓ Tenant ${config.slug} already exists`);
        tenantId = existingTenant.id;
      } else {
        // Create tenant
        const tenant = await prisma.tenant.create({
          data: {
            slug: config.slug,
            name: config.name,
            emailSlug: config.slug,
            status: 'ACTIVE',
            inboundEmailAddress: `${config.slug}@reports.valorfs.app`,
            inboundEmailEnabled: true,
          },
        });

        tenantId = tenant.id;
        results.tenantsCreated.push(config.slug);
        console.log(`✓ Created tenant: ${config.slug}`);
      }

      // Check if user already exists in Supabase Auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingUsers.users.find(u => u.email === config.email);

      let userId: string;

      if (existingAuthUser) {
        console.log(`✓ Auth user ${config.email} already exists`);
        userId = existingAuthUser.id;
      } else {
        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: config.email,
          password: config.password,
          email_confirm: true, // Auto-confirm for tests
        });

        if (authError || !authData.user) {
          throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        userId = authData.user.id;
        console.log(`✓ Created auth user: ${config.email}`);
      }

      // Check if database user already exists
      const existingDbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (existingDbUser) {
        console.log(`✓ Database user ${config.email} already exists`);
      } else {
        // Create database user with tenant context
        await prisma.$transaction(async (tx) => {
          // Set RLS context
          await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;

          // Create user
          await tx.user.create({
            data: {
              id: userId,
              tenantId: tenantId,
              email: config.email,
              firstName: 'Test',
              lastName: 'User',
              role: 'ADMINISTRATOR',
              status: 'ACTIVE',
              emailVerified: true,
            },
          });
        });

        results.usersCreated.push(config.email);
        console.log(`✓ Created database user: ${config.email}`);
      }
    } catch (error: any) {
      const errorMsg = `Failed to create ${key}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`✗ ${errorMsg}`);
    }
  }

  return results;
}

/**
 * Cleans up test tenants and users
 * WARNING: This will delete all data for test tenants
 */
export async function cleanupTestTenants() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    tenantsDeleted: [] as string[],
    usersDeleted: [] as string[],
    errors: [] as string[],
  };

  for (const [key, config] of Object.entries(TEST_TENANTS)) {
    try {
      // Find tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: config.slug },
        include: { users: true },
      });

      if (!tenant) {
        console.log(`ℹ Tenant ${config.slug} does not exist`);
        continue;
      }

      // Delete Supabase Auth users
      for (const user of tenant.users) {
        try {
          await supabase.auth.admin.deleteUser(user.id);
          results.usersDeleted.push(user.email);
          console.log(`✓ Deleted auth user: ${user.email}`);
        } catch (error: any) {
          console.warn(`⚠ Could not delete auth user ${user.email}: ${error.message}`);
        }
      }

      // Delete tenant (cascades to users and other related data via Prisma schema)
      await prisma.tenant.delete({
        where: { id: tenant.id },
      });

      results.tenantsDeleted.push(config.slug);
      console.log(`✓ Deleted tenant: ${config.slug}`);
    } catch (error: any) {
      const errorMsg = `Failed to cleanup ${key}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`✗ ${errorMsg}`);
    }
  }

  return results;
}

/**
 * Creates test data for a tenant (cases, quotes, etc.)
 * Used to populate test tenants with realistic data
 */
export async function createTestData(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { users: { take: 1 } },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found`);
  }

  if (tenant.users.length === 0) {
    throw new Error(`No users found for tenant ${tenantSlug}`);
  }

  const userId = tenant.users[0].id;

  // Create test data in transaction with RLS context
  const results = await prisma.$transaction(async (tx) => {
    // Set RLS context
    await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenant.id}`;

    // Create a test case
    const testCase = await tx.case.create({
      data: {
        tenantId: tenant.id,
        status: 'DRAFT',
        assignedToId: userId,
        clientFirstName: 'Test',
        clientLastName: 'Client',
        clientEmail: 'test.client@example.com',
        clientPhone: '555-0100',
        clientDob: new Date('1980-01-01'),
        type: 'NEW_BUSINESS',
      },
    });

    // Create a test quote
    const testQuote = await tx.quote.create({
      data: {
        tenantId: tenant.id,
        caseId: testCase.id,
        status: 'PENDING',
        productType: 'TERM_LIFE',
        coverageAmount: 500000,
        annualPremium: 1200,
        carrier: 'Test Carrier',
      },
    });

    return {
      case: testCase,
      quote: testQuote,
    };
  });

  console.log(`✓ Created test data for ${tenantSlug}:`, {
    caseId: results.case.id,
    quoteId: results.quote.id,
  });

  return results;
}

/**
 * Verifies test tenant setup is correct
 */
export async function verifyTestTenants() {
  const issues: string[] = [];

  for (const [key, config] of Object.entries(TEST_TENANTS)) {
    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: config.slug },
      include: { users: true },
    });

    if (!tenant) {
      issues.push(`Tenant ${config.slug} does not exist`);
      continue;
    }

    // Check user exists
    const user = tenant.users.find(u => u.email === config.email);
    if (!user) {
      issues.push(`User ${config.email} does not exist for tenant ${config.slug}`);
    }

    // Check user has correct role
    if (user && user.role !== 'ADMINISTRATOR') {
      issues.push(`User ${config.email} is not an ADMINISTRATOR (role: ${user.role})`);
    }
  }

  if (issues.length > 0) {
    console.error('❌ Test tenant verification failed:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    return false;
  }

  console.log('✓ All test tenants verified successfully');
  return true;
}
