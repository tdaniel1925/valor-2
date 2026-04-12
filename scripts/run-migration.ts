import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    const sqlFilePath = path.join(__dirname, 'migrate-cases-table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running migration...\n');
    console.log(sql);
    console.log('\n======================\n');

    await client.query(sql);

    console.log('✓ Migration completed successfully');

    // Verify the schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases'
      ORDER BY ordinal_position
    `);

    console.log('\n=== CASES TABLE SCHEMA ===');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
