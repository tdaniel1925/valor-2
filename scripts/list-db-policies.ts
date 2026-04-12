import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listDbPolicies() {
  const client = await pool.connect();

  try {
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    const policies = await client.query(
      'SELECT DISTINCT "policyNumber" FROM commissions WHERE "tenantId" = $1 AND "policyNumber" IS NOT NULL ORDER BY "policyNumber"',
      [tenantId]
    );

    console.log(`\nDatabase has ${policies.rows.length} unique policies:\n`);
    policies.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.policyNumber}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

listDbPolicies().catch(console.error);
