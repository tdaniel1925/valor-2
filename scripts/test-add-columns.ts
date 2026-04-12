import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addColumns() {
  const client = await pool.connect();

  try {
    const sqlFilePath = path.join(__dirname, 'add-case-columns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Adding columns to cases table...\n');

    await client.query(sql);

    console.log('✓ Columns added successfully\n');

    // Verify the schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases'
      AND column_name IN (
        'primaryAdvisor', 'primaryInsured', 'type', 'targetAmount',
        'commAnnualizedPrem', 'weightedPremium', 'excessPrem',
        'statusDate', 'requirements'
      )
      ORDER BY column_name
    `);

    console.log('=== NEW COLUMNS IN CASES TABLE ===');
    result.rows.forEach(row => {
      console.log(`✓ ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error('Failed to add columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumns().catch(console.error);
