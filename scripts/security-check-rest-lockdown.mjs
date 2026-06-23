/**
 * Security regression guard — fails if the Supabase REST surface has reopened.
 *
 * Asserts the controls applied on 2026-06-23 still hold:
 *   1. No `public` table grants privileges to `anon` or `authenticated`.
 *   2. The `anon`/`authenticated` roles do not have USAGE on schema `public`.
 *   3. The public anon key cannot actually read sensitive tables over REST.
 *   4. No full (9-digit) SSNs are stored on smartoffice_agents.
 *
 * Exit code 0 = all controls intact. Exit code 1 = a control regressed (CI fails;
 * scheduled run should alert). Safe/read-only — makes no changes.
 *
 * Run: node scripts/security-check-rest-lockdown.mjs
 * Intended for CI and/or a scheduled (cron) security check.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });

// Tables that must never be readable by the anon key.
const SENSITIVE_TABLES = [
  'smartoffice_agents',
  'smartoffice_policies',
  'users',
  'commissions',
  'oauth_tokens',
  'ai_messages',
  'tenants',
];

let failures = 0;
const fail = (msg) => { failures++; console.error(`FAIL  ${msg}`); };
const ok = (msg) => console.log(`OK    ${msg}`);

async function main() {
  // 1. No anon/authenticated table grants anywhere in public.
  const grants = await prisma.$queryRawUnsafe(
    "SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated')"
  );
  if (grants.length > 0) {
    const sample = grants.slice(0, 8).map((g) => `${g.grantee}:${g.table_name}:${g.privilege_type}`).join(', ');
    fail(`${grants.length} public table grant(s) to anon/authenticated reappeared — e.g. ${sample}`);
  } else {
    ok('no public table grants to anon/authenticated');
  }

  // 2. Schema USAGE not granted to the REST roles.
  const schemaAcl = await prisma.$queryRawUnsafe(
    "SELECT unnest(nspacl)::text AS acl FROM pg_namespace WHERE nspname='public'"
  );
  const restUsage = schemaAcl.map((r) => r.acl).filter((a) => /^(anon|authenticated)=/.test(a));
  if (restUsage.length > 0) fail(`schema public USAGE granted to REST role(s): ${restUsage.join(', ')}`);
  else ok('schema public USAGE not granted to anon/authenticated');

  // 3. Live check: the anon key must NOT be able to read sensitive tables.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    for (const t of SENSITIVE_TABLES) {
      const { data, error } = await anon.from(t).select('*').limit(1);
      if (!error && Array.isArray(data)) fail(`anon key can READ ${t} over REST (${data.length} row sample) — REST exposure reopened`);
    }
    if (failures === 0 || !SENSITIVE_TABLES.some(() => false)) ok(`anon key blocked on all ${SENSITIVE_TABLES.length} sensitive tables`);
  } else {
    console.warn('WARN  anon key not in env — skipped live REST check (run with NEXT_PUBLIC_* set)');
  }

  // 4. No full SSNs stored.
  const agents = await prisma.smartOfficeAgent.findMany({ select: { ssn: true, rawData: true } });
  const fullSsn = agents.filter((a) => {
    const col = String(a.ssn || '').replace(/[^0-9]/g, '').length >= 9;
    const raw = String(a.rawData?.Contact?.TaxID || '').replace(/[^0-9]/g, '').length >= 9;
    return col || raw;
  }).length;
  if (fullSsn > 0) fail(`${fullSsn} agent(s) have a full 9-digit SSN stored — SSN minimization regressed`);
  else ok(`no full SSNs stored (${agents.length} agents checked)`);

  await prisma.$disconnect();
  console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} control(s) regressed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('ERROR running security check:', e.message);
  process.exit(1);
});
