import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTrentAdmin() {
  const client = await pool.connect();

  try {
    // Get the valor tenant
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Valor tenant not found');
    }

    const tenantId = tenantResult.rows[0].id;
    console.log('Valor Tenant ID:', tenantId);

    // Check if trenttdaniel@gmail.com exists
    let trentResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2',
      ['trenttdaniel@gmail.com', tenantId]
    );

    let trentId;
    if (trentResult.rows.length === 0) {
      // Create trenttdaniel user in valor tenant
      // Note: Password hashing should be done by Supabase Auth, not stored directly
      console.log('\nCreating trenttdaniel@gmail.com in Valor tenant...');
      const createResult = await client.query(
        `INSERT INTO users (
          id, "tenantId", email, "firstName", "lastName",
          role, status, "emailVerified", "createdAt", "updatedAt"
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id`,
        [tenantId, 'trenttdaniel@gmail.com', 'Trent', 'Daniel', 'ADMINISTRATOR', 'ACTIVE', true]
      );
      trentId = createResult.rows[0].id;
      console.log('✓ Created trenttdaniel@gmail.com:', trentId);
      console.log('\nIMPORTANT: Password needs to be set via Supabase Auth.');
      console.log('You need to create this user in Supabase Auth dashboard or via API.');
    } else {
      trentId = trentResult.rows[0].id;
      console.log('\n✓ trenttdaniel@gmail.com already exists:', trentId);
    }

    // Count current commissions
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM commissions WHERE "tenantId" = $1',
      [tenantId]
    );

    const totalCommissions = parseInt(countResult.rows[0].count);
    console.log(`\nTotal commissions: ${totalCommissions}`);

    // Assign all commissions to trent
    const updateResult = await client.query(
      'UPDATE commissions SET "userId" = $1 WHERE "tenantId" = $2',
      [trentId, tenantId]
    );

    console.log(`✓ Assigned ${updateResult.rowCount} commissions to trenttdaniel@gmail.com`);

    console.log('\n=== Setup Complete ===');
    console.log('trenttdaniel@gmail.com is now set up as admin with all commission data.');
    console.log('\nNext step: Set password in Supabase Auth dashboard');
    console.log('Email: trenttdaniel@gmail.com');
    console.log('Password: 4Xkilla1@');

  } finally {
    client.release();
    await pool.end();
  }
}

createTrentAdmin().catch(console.error);
