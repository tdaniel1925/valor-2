import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findExactDuplicates() {
  const client = await pool.connect();

  try {
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    console.log('=== Finding Exact Duplicate Commissions ===\n');

    // Find commissions with identical data
    const query = `
      SELECT
        "policyNumber",
        "primaryAdvisor",
        "advisorName",
        "primaryInsured",
        carrier,
        amount,
        "commAnnualizedPrem",
        "checkDate",
        "statusDate",
        COUNT(*) as count,
        ARRAY_AGG(id) as ids
      FROM commissions
      WHERE "tenantId" = $1
      GROUP BY
        "policyNumber",
        "primaryAdvisor",
        "advisorName",
        "primaryInsured",
        carrier,
        amount,
        "commAnnualizedPrem",
        "checkDate",
        "statusDate"
      HAVING COUNT(*) > 1
      ORDER BY "policyNumber", amount
    `;

    const result = await client.query(query, [tenantId]);

    if (result.rows.length === 0) {
      console.log('No exact duplicates found.\n');
    } else {
      console.log(`Found ${result.rows.length} sets of duplicate records:\n`);

      let totalDuplicates = 0;

      result.rows.forEach((dup, index) => {
        const extraCopies = dup.count - 1;
        totalDuplicates += extraCopies;

        console.log(`${index + 1}. Policy: ${dup.policyNumber}`);
        console.log(`   Client: ${dup.primaryInsured}`);
        console.log(`   Advisor: ${dup.primaryAdvisor}`);
        console.log(`   Advisor Name: ${dup.advisorName}`);
        console.log(`   Amount: $${dup.amount}`);
        console.log(`   Premium: $${dup.commAnnualizedPrem || 'N/A'}`);
        console.log(`   Check Date: ${dup.checkDate ? new Date(dup.checkDate).toLocaleDateString() : 'N/A'}`);
        console.log(`   Duplicate Count: ${dup.count}`);
        console.log(`   IDs: ${dup.ids.join(', ')}`);
        console.log('');
      });

      console.log(`\nTotal extra duplicate records: ${totalDuplicates}`);
      console.log(`\nIf removed, you would have ${165 - totalDuplicates} commission records.`);
    }

    // Also check how many unique policies we have
    const uniquePoliciesQuery = `
      SELECT COUNT(DISTINCT "policyNumber") as unique_count
      FROM commissions
      WHERE "tenantId" = $1 AND "policyNumber" IS NOT NULL
    `;

    const uniqueResult = await client.query(uniquePoliciesQuery, [tenantId]);
    console.log(`\nCurrent unique policy count: ${uniqueResult.rows[0].unique_count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

findExactDuplicates().catch(console.error);
