import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function assignToPhil() {
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

    // Get phil's ID
    const philResult = await client.query(
      'SELECT id, email, "firstName", "lastName" FROM users WHERE email = $1 AND "tenantId" = $2',
      ['phil@valorfs.com', tenantId]
    );

    if (philResult.rows.length === 0) {
      throw new Error('phil@valorfs.com not found in Valor tenant');
    }

    const phil = philResult.rows[0];
    console.log('✓ Found:', phil.email);
    console.log(`  Name: ${phil.firstName} ${phil.lastName}`);
    console.log(`  ID: ${phil.id}`);

    // Get all commissions count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM commissions WHERE "tenantId" = $1',
      [tenantId]
    );

    const totalCommissions = parseInt(countResult.rows[0].count);
    console.log(`\nTotal commissions: ${totalCommissions}`);

    // Assign all commissions to phil
    const updateResult = await client.query(
      'UPDATE commissions SET "userId" = $1 WHERE "tenantId" = $2',
      [phil.id, tenantId]
    );

    console.log(`✓ Assigned ${updateResult.rowCount} commissions to phil@valorfs.com`);

    console.log('\n=== Setup Complete ===');
    console.log('phil@valorfs.com can now access all commission data.');

  } finally {
    client.release();
    await pool.end();
  }
}

assignToPhil().catch(console.error);
