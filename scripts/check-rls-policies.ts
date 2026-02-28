/**
 * Check RLS policy definitions in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPolicies() {
  console.log('🔍 Checking RLS Policy Definitions...\n');

  // Check quotes table as example
  const policies = await prisma.$queryRaw<Array<{
    tablename: string;
    policyname: string;
    permissive: string;
    roles: string[];
    cmd: string;
    qual: string;
    with_check: string;
  }>>`
    SELECT
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename IN ('quotes', 'cases', 'users')
    ORDER BY tablename, policyname
  `;

  console.log('Found', policies.length, 'policies:\n');

  for (const policy of policies) {
    console.log(`📋 Table: ${policy.tablename}`);
    console.log(`   Policy: ${policy.policyname}`);
    console.log(`   Command: ${policy.cmd}`);
    console.log(`   Roles: ${policy.roles?.join(', ')}`);
    console.log(`   Filter (USING): ${policy.qual}`);
    console.log(`   Check (WITH CHECK): ${policy.with_check || 'N/A'}`);
    console.log();
  }

  // Check if RLS is enabled and forced
  const rlsStatus = await prisma.$queryRaw<Array<{
    tablename: string;
    rowsecurity: boolean;
    forcerowsecurity: boolean;
  }>>`
    SELECT
      c.relname as tablename,
      c.relrowsecurity as rowsecurity,
      c.relforcerowsecurity as forcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('quotes', 'cases', 'users')
    ORDER BY c.relname
  `;

  console.log('RLS Status:');
  console.log('='.repeat(60));
  for (const table of rlsStatus) {
    console.log(`${table.tablename}:`);
    console.log(`  RLS Enabled: ${table.rowsecurity ? '✓' : '✗'}`);
    console.log(`  RLS Forced: ${table.forcerowsecurity ? '✓' : '✗'}`);
  }

  await prisma.$disconnect();
}

checkPolicies().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
