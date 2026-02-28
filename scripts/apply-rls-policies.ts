/**
 * Apply RLS Policies to Production Database
 *
 * This script applies the RLS policies that were defined in migrations
 * but not actually executed (because we baselined them).
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function applyRlsPolicies() {
  console.log('📋 Applying RLS policies to production database...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      '20260227112311_add_rls_policies',
      'migration.sql'
    );

    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Read migration file:', migrationPath);
    console.log(`📏 SQL length: ${sql.length} characters\n`);

    // Remove multi-line comments and split SQL into individual statements
    const cleanSql = sql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */ comments
      .replace(/--[^\n]*/g, ''); // Remove -- comments

    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`⚙️  Executing ${statements.length} SQL statements...\n`);

    // Execute each statement individually
    let successCount = 0;
    let skipCount = 0;
    let alreadyExistsCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        process.stdout.write(`✓ [${i + 1}/${statements.length}] ${statement.substring(0, 60)}...\n`);
        successCount++;
      } catch (error: any) {
        const errorMsg = error.message || '';

        // Ignore "already exists" errors (in case we run this multiple times)
        if (errorMsg.includes('already exists')) {
          process.stdout.write(`⚠ [${i + 1}/${statements.length}] Already exists: ${statement.substring(0, 60)}...\n`);
          alreadyExistsCount++;
        }
        // Ignore "does not exist" errors (table not in schema yet)
        else if (errorMsg.includes('does not exist')) {
          process.stdout.write(`⊘ [${i + 1}/${statements.length}] Table not found (skipping): ${statement.substring(0, 60)}...\n`);
          skipCount++;
        }
        else {
          throw error;
        }
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`  ✓ Applied: ${successCount}`);
    console.log(`  ⚠ Already existed: ${alreadyExistsCount}`);
    console.log(`  ⊘ Skipped (table not found): ${skipCount}`);

    console.log('\n✅ RLS policies applied successfully!\n');

    // Verify policies were created
    const policiesCheck = await prisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE policyname LIKE 'tenant_isolation%'
      ORDER BY tablename, policyname
    `;

    console.log('📊 Verified RLS Policies in Database:');
    console.log('='.repeat(60));

    const groupedByTable: Record<string, string[]> = {};
    for (const policy of policiesCheck) {
      if (!groupedByTable[policy.tablename]) {
        groupedByTable[policy.tablename] = [];
      }
      groupedByTable[policy.tablename].push(policy.policyname);
    }

    for (const [table, policies] of Object.entries(groupedByTable)) {
      console.log(`\n${table}:`);
      policies.forEach(p => console.log(`  - ${p}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Total: ${policiesCheck.length} RLS policies active`);
    console.log(`✅ Tables protected: ${Object.keys(groupedByTable).length}`);

  } catch (error) {
    console.error('\n❌ Failed to apply RLS policies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyRlsPolicies().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
