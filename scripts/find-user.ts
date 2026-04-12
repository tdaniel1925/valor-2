import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findUser() {
  const client = await pool.connect();

  try {
    const email = 'tdaniel@botmakers.ai';

    // Search across all tenants
    const result = await client.query(
      `SELECT u.id, u.email, u."firstName", u."lastName", u.role, u.status,
              t.name as tenant_name, t.slug as tenant_slug
       FROM users u
       JOIN tenants t ON u."tenantId" = t.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✓ Found: ${email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Tenant: ${user.tenant_name} (${user.tenant_slug})`);
      console.log(`  ID: ${user.id}`);
    } else {
      console.log(`✗ NOT FOUND: ${email}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

findUser().catch(console.error);
