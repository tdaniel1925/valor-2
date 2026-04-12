import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTenant() {
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT id, name, slug FROM tenants');
    console.log('Available tenants:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (slug: ${row.slug}, id: ${row.id})`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkTenant().catch(console.error);
