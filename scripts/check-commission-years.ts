import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCommissionYears() {
  const client = await pool.connect();

  try {
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    // Group commissions by year from checkDate
    const yearQuery = `
      SELECT
        EXTRACT(YEAR FROM "checkDate") as year,
        COUNT(*) as count,
        SUM(amount) as total
      FROM commissions
      WHERE "tenantId" = $1 AND "checkDate" IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM "checkDate")
      ORDER BY year
    `;

    const result = await client.query(yearQuery, [tenantId]);

    console.log('\n=== Commissions by Check Date Year ===\n');
    result.rows.forEach(row => {
      console.log(`Year ${row.year}:`);
      console.log(`  Count: ${row.count}`);
      console.log(`  Total: $${parseFloat(row.total).toLocaleString()}`);
      console.log('');
    });

    // Show commissions from non-2026 years
    if (result.rows.some(r => r.year != 2026)) {
      console.log('\n=== Non-2026 Commission Details ===\n');

      const detailQuery = `
        SELECT
          "policyNumber",
          "primaryInsured",
          "primaryAdvisor",
          amount,
          "checkDate"
        FROM commissions
        WHERE "tenantId" = $1
          AND "checkDate" IS NOT NULL
          AND EXTRACT(YEAR FROM "checkDate") != 2026
        ORDER BY "checkDate"
      `;

      const details = await client.query(detailQuery, [tenantId]);

      details.rows.forEach((row, index) => {
        console.log(`${index + 1}. Policy: ${row.policyNumber}`);
        console.log(`   Client: ${row.primaryInsured}`);
        console.log(`   Advisor: ${row.primaryAdvisor}`);
        console.log(`   Amount: $${row.amount}`);
        console.log(`   Check Date: ${new Date(row.checkDate).toLocaleDateString()}`);
        console.log('');
      });
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkCommissionYears().catch(console.error);
