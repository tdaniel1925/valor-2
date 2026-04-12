import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reassignCommissions() {
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

    // Get the system import user
    const systemUserResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2',
      ['smartoffice-import@system', tenantId]
    );

    if (systemUserResult.rows.length === 0) {
      throw new Error('System import user not found');
    }

    const systemUserId = systemUserResult.rows[0].id;

    // Get the demo user (or first active non-system user)
    const demoUserResult = await client.query(
      `SELECT id, email, "firstName", "lastName" FROM users
       WHERE "tenantId" = $1 AND email != $2 AND status = 'ACTIVE'
       ORDER BY "createdAt" ASC
       LIMIT 1`,
      [tenantId, 'smartoffice-import@system']
    );

    if (demoUserResult.rows.length === 0) {
      throw new Error('No demo user found');
    }

    const demoUser = demoUserResult.rows[0];
    console.log('Demo user:', demoUser.email, demoUser.firstName, demoUser.lastName);

    // Count commissions to reassign
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM commissions WHERE "tenantId" = $1 AND "userId" = $2',
      [tenantId, systemUserId]
    );

    const count = parseInt(countResult.rows[0].count);
    console.log(`Found ${count} commissions to reassign from system user to demo user`);

    if (count === 0) {
      console.log('No commissions to reassign');
      return;
    }

    // Reassign commissions
    const updateResult = await client.query(
      'UPDATE commissions SET "userId" = $1 WHERE "tenantId" = $2 AND "userId" = $3',
      [demoUser.id, tenantId, systemUserId]
    );

    console.log(`Successfully reassigned ${updateResult.rowCount} commissions to ${demoUser.email}`);

  } finally {
    client.release();
    await pool.end();
  }
}

reassignCommissions().catch(console.error);
