import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAdminUsers() {
  const client = await pool.connect();

  try {
    // Get the valor tenant
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenantId = tenantResult.rows[0].id;

    // Check for admin users
    const adminEmails = ['daniel@botmakers.com', 'phil@valorfs.com'];

    console.log('\n=== Checking Admin Users ===');

    for (const email of adminEmails) {
      const result = await client.query(
        `SELECT id, email, "firstName", "lastName", role, status
         FROM users
         WHERE "tenantId" = $1 AND email = $2`,
        [tenantId, email]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(`✓ Found: ${email}`);
        console.log(`  Name: ${user.firstName} ${user.lastName}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  ID: ${user.id}`);
      } else {
        console.log(`✗ NOT FOUND: ${email}`);
      }
      console.log('');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkAdminUsers().catch(console.error);
