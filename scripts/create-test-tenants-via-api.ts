/**
 * Create test tenants using the signup API
 * This ensures tenants are created the same way as real signups
 */

async function createTenant(subdomain: string, email: string, password: string, agencyName: string) {
  const response = await fetch('http://localhost:2050/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subdomain,
      email,
      password,
      agencyName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Failed to create ${subdomain}:`, data.error);
    return null;
  }

  console.log(`✅ Created tenant ${subdomain}:`, data);
  return data;
}

async function main() {
  console.log('========================================');
  console.log('  Creating Test Tenants via API');
  console.log('========================================\n');

  console.log('Make sure dev server is running on http://localhost:2050\n');

  // Create Tenant A
  const tenantA = await createTenant(
    'test-agency-a',
    'admin@test-agency-a.com',
    'TestPassword123!',
    'Test Agency A'
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create Tenant B
  const tenantB = await createTenant(
    'test-agency-b',
    'admin@test-agency-b.com',
    'TestPassword123!',
    'Test Agency B'
  );

  console.log('\n========================================');
  console.log('  Test Tenants Created');
  console.log('========================================\n');

  if (tenantA) {
    console.log('Tenant A:');
    console.log(`  URL: http://test-agency-a.localhost:2050`);
    console.log(`  Email: admin@test-agency-a.com`);
    console.log(`  Password: TestPassword123!`);
    console.log('');
  }

  if (tenantB) {
    console.log('Tenant B:');
    console.log(`  URL: http://test-agency-b.localhost:2050`);
    console.log(`  Email: admin@test-agency-b.com`);
    console.log(`  Password: TestPassword123!`);
    console.log('');
  }

  console.log('Run tests with: npm run test:security\n');
}

main().catch(console.error);
