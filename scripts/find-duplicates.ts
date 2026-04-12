import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findDuplicates() {
  const client = await pool.connect();

  try {
    // Get the valor tenant
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    // Find exact duplicates (same policy, advisor, amount, dates)
    const duplicatesQuery = `
      SELECT
        "policyNumber",
        "primaryAdvisor",
        "primaryInsured",
        carrier,
        amount,
        "commAnnualizedPrem",
        "checkDate",
        COUNT(*) as count
      FROM commissions
      WHERE "tenantId" = $1
      GROUP BY
        "policyNumber",
        "primaryAdvisor",
        "primaryInsured",
        carrier,
        amount,
        "commAnnualizedPrem",
        "checkDate"
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, "policyNumber"
    `;

    const duplicates = await client.query(duplicatesQuery, [tenantId]);

    console.log('\n=== Duplicate Commission Records ===\n');

    if (duplicates.rows.length === 0) {
      console.log('No exact duplicates found.');
    } else {
      console.log(`Found ${duplicates.rows.length} sets of duplicate records:\n`);

      duplicates.rows.forEach((dup, index) => {
        console.log(`${index + 1}. Policy: ${dup.policyNumber || 'N/A'}`);
        console.log(`   Client: ${dup.primaryInsured || 'N/A'}`);
        console.log(`   Advisor: ${dup.primaryAdvisor || 'N/A'}`);
        console.log(`   Carrier: ${dup.carrier}`);
        console.log(`   Amount: $${dup.amount}`);
        console.log(`   Premium: $${dup.commAnnualizedPrem || 'N/A'}`);
        console.log(`   Check Date: ${dup.checkDate ? new Date(dup.checkDate).toLocaleDateString() : 'N/A'}`);
        console.log(`   Duplicate Count: ${dup.count} records`);
        console.log('');
      });

      // Get total duplicate count
      const totalDuplicates = duplicates.rows.reduce((sum, row) => sum + (row.count - 1), 0);
      console.log(`\nTotal duplicate records (extras): ${totalDuplicates}`);
    }

    // Also check for policy number duplicates (different amounts)
    const policyDupsQuery = `
      SELECT
        "policyNumber",
        COUNT(DISTINCT amount) as unique_amounts,
        COUNT(*) as total_records,
        ARRAY_AGG(DISTINCT "primaryInsured") as clients,
        ARRAY_AGG(DISTINCT "primaryAdvisor") as advisors
      FROM commissions
      WHERE "tenantId" = $1 AND "policyNumber" IS NOT NULL
      GROUP BY "policyNumber"
      HAVING COUNT(*) > 10
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `;

    const policyDups = await client.query(policyDupsQuery, [tenantId]);

    if (policyDups.rows.length > 0) {
      console.log('\n=== Policies with Many Records (splits) ===\n');
      policyDups.rows.forEach((pol, index) => {
        console.log(`${index + 1}. Policy: ${pol.policyNumber}`);
        console.log(`   Total Records: ${pol.total_records}`);
        console.log(`   Unique Amounts: ${pol.unique_amounts}`);
        console.log(`   Clients: ${pol.clients.join(', ')}`);
        console.log(`   Advisors: ${pol.advisors.slice(0, 3).join(', ')}${pol.advisors.length > 3 ? '...' : ''}`);
        console.log('');
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

findDuplicates().catch(console.error);
