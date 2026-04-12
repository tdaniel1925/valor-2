import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCommissions() {
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

    // Count all commissions by user
    const result = await client.query(
      `SELECT
        u.email,
        u."firstName",
        u."lastName",
        COUNT(c.id) as commission_count,
        SUM(c.amount) as total_amount
       FROM commissions c
       JOIN users u ON c."userId" = u.id
       WHERE c."tenantId" = $1
       GROUP BY u.id, u.email, u."firstName", u."lastName"
       ORDER BY commission_count DESC`,
      [tenantId]
    );

    console.log('\n=== Commission Summary by User ===');
    result.rows.forEach(row => {
      console.log(`${row.firstName} ${row.lastName} (${row.email})`);
      console.log(`  Count: ${row.commission_count}`);
      console.log(`  Total: $${parseFloat(row.total_amount).toFixed(2)}`);
      console.log('');
    });

    // Total count
    const totalResult = await client.query(
      'SELECT COUNT(*) as count FROM commissions WHERE "tenantId" = $1',
      [tenantId]
    );

    console.log(`Total commissions in system: ${totalResult.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

checkCommissions().catch(console.error);
