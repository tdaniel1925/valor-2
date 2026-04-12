import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPolicy() {
  const client = await pool.connect();

  try {
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    // Check BU6362557 and 42805186 (the ones visible in screenshot)
    const policies = ['BU6362557', '42805186'];

    for (const policyNum of policies) {
      console.log(`\n=== Policy ${policyNum} ===\n`);

      const result = await client.query(
        `SELECT
          id,
          "policyNumber",
          "primaryInsured",
          "primaryAdvisor",
          "advisorName",
          carrier,
          amount,
          "commAnnualizedPrem",
          "premiumMode",
          "checkDate",
          status,
          "createdAt"
        FROM commissions
        WHERE "tenantId" = $1 AND "policyNumber" = $2
        ORDER BY "createdAt", amount`,
        [tenantId, policyNum]
      );

      console.log(`Found ${result.rows.length} records:\n`);

      result.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Client: ${row.primaryInsured}`);
        console.log(`  Advisor: ${row.primaryAdvisor}`);
        console.log(`  Advisor Name: ${row.advisorName}`);
        console.log(`  Amount: $${row.amount}`);
        console.log(`  Premium: $${row.commAnnualizedPrem} (${row.premiumMode})`);
        console.log(`  Check Date: ${row.checkDate ? new Date(row.checkDate).toLocaleDateString() : 'N/A'}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Created: ${new Date(row.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkPolicy().catch(console.error);
