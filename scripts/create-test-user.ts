/**
 * Script to create test user for E2E tests
 *
 * Usage:
 *   npx ts-node scripts/create-test-user.ts
 *
 * This script creates a test user in Supabase Auth for running E2E tests.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const TEST_USER = {
  email: 'test@valortest.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

async function createTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase environment variables');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log(`\n📝 Creating test user: ${TEST_USER.email}`);

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = existingUsers?.users?.find((u: any) => u.email === TEST_USER.email);

    if (existingUser) {
      console.log(`⚠️  User already exists with ID: ${existingUser.id}`);
      console.log('   Deleting existing user and recreating...');

      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('❌ Error deleting existing user:', deleteError.message);
        process.exit(1);
      }
      console.log('✅ Existing user deleted');
    }

    // Create the user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
      },
    });

    if (createError || !userData.user) {
      console.error('❌ Error creating user:', createError?.message);
      process.exit(1);
    }

    console.log('✅ Test user created successfully!');
    console.log(`   User ID: ${userData.user.id}`);
    console.log(`   Email: ${userData.user.email}`);

    // Now sync the user to the database
    console.log('\n📝 Syncing user to database...');

    // Import prisma to create user record
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Get tenant ID (use default tenant)
      const tenantId = process.env.DEFAULT_TENANT_ID;

      if (!tenantId) {
        console.warn('⚠️  Warning: DEFAULT_TENANT_ID not set. User may not have tenant access.');
      }

      // Create or update user in database
      const dbUser = await prisma.user.upsert({
        where: {
          id: userData.user.id,
        },
        create: {
          id: userData.user.id,
          email: TEST_USER.email,
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          emailVerified: true,
          tenantId: tenantId || 'valor-default-tenant',
          role: 'AGENT', // Default role
          status: 'ACTIVE',
        },
        update: {
          email: TEST_USER.email,
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          emailVerified: true,
        },
      });

      console.log('✅ User synced to database');
      console.log(`   Database ID: ${dbUser.id}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Tenant ID: ${dbUser.tenantId || 'None'}`);

      await prisma.$disconnect();
    } catch (dbError: any) {
      console.error('❌ Error syncing to database:', dbError.message);
      console.error('   User created in Auth but not in database.');
      console.error('   The user will be synced on first login.');
    }

    console.log('\n✅ Test user setup complete!');
    console.log('\n📋 Test User Credentials:');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log('\n🧪 You can now run E2E tests:');
    console.log('   npm run test:auth');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
