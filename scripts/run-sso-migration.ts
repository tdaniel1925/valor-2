import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runSsoMigration() {
  try {
    console.log('🚀 Running SSO tables migration...\n');

    const sqlFile = path.join(__dirname, 'create-sso-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
      console.log('✅ Success\n');
    }

    console.log('✅ All SSO tables created successfully!');
    console.log('\nTables created:');
    console.log('  - oauth_clients');
    console.log('  - oauth_authorization_codes');
    console.log('  - oauth_tokens');
    console.log('\nIndexes created:');
    console.log('  - oauth_clients_tenant_id_idx');
    console.log('  - oauth_clients_client_id_idx');
    console.log('  - oauth_authorization_codes_code_idx');
    console.log('  - oauth_authorization_codes_client_id_idx');
    console.log('  - oauth_authorization_codes_user_id_idx');
    console.log('  - oauth_tokens_access_token_idx');
    console.log('  - oauth_tokens_refresh_token_idx');
    console.log('  - oauth_tokens_client_id_idx');
    console.log('  - oauth_tokens_user_id_idx');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSsoMigration();
