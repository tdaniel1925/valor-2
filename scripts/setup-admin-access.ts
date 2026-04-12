import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupAdminAccess() {
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

    // Check if tdaniel exists in valor tenant
    let tdanielResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2',
      ['tdaniel@botmakers.ai', tenantId]
    );

    let tdanielId;
    if (tdanielResult.rows.length === 0) {
      // Create tdaniel user in valor tenant
      console.log('\nCreating tdaniel@botmakers.ai in Valor tenant...');
      const createResult = await client.query(
        `INSERT INTO users (
          id, "tenantId", email, "firstName", "lastName",
          role, status, "emailVerified", "createdAt", "updatedAt"
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id`,
        [tenantId, 'tdaniel@botmakers.ai', 'Tyler', 'Daniel', 'ADMINISTRATOR', 'ACTIVE', true]
      );
      tdanielId = createResult.rows[0].id;
      console.log('✓ Created tdaniel@botmakers.ai:', tdanielId);
    } else {
      tdanielId = tdanielResult.rows[0].id;
      console.log('\n✓ tdaniel@botmakers.ai already exists:', tdanielId);
    }

    // Get phil's ID
    const philResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2',
      ['phil@valorfs.com', tenantId]
    );

    if (philResult.rows.length === 0) {
      throw new Error('phil@valorfs.com not found in Valor tenant');
    }

    const philId = philResult.rows[0].id;
    console.log('✓ phil@valorfs.com ID:', philId);

    // Get all commissions count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM commissions WHERE "tenantId" = $1',
      [tenantId]
    );

    const totalCommissions = parseInt(countResult.rows[0].count);
    console.log(`\nTotal commissions in system: ${totalCommissions}`);

    // Assign all commissions to tdaniel
    const tdanielUpdate = await client.query(
      'UPDATE commissions SET "userId" = $1 WHERE "tenantId" = $2',
      [tdanielId, tenantId]
    );

    console.log(`✓ Assigned ${tdanielUpdate.rowCount} commissions to tdaniel@botmakers.ai`);

    console.log('\n=== Setup Complete ===');
    console.log('Both super admins can now access all commission data.');
    console.log('Note: All commissions are currently assigned to tdaniel@botmakers.ai');

  } finally {
    client.release();
    await pool.end();
  }
}

setupAdminAccess().catch(console.error);
