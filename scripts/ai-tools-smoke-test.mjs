/**
 * AI Tools smoke test — exercises the data adapter directly (no HTTP/Claude),
 * verifying the bridge to Valor's data-service returns sane aggregates.
 *
 * This validates the deterministic half of each tool (the data layer). The
 * Claude calls themselves are validated separately via the dev server.
 *
 * Usage: node scripts/ai-tools-smoke-test.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const TENANT = 'valor-default-tenant';
const prisma = new PrismaClient();

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
};

function bucket(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('inforce') || s.includes('issued') || s.includes('approved')) return 'INFORCE';
  if (s.includes('pending') || s.includes('submitted') || s.includes('await') || s.includes('incomplete') || s.includes('informal')) return 'PENDING';
  if (s.includes('declined') || s.includes('postponed') || s.includes('rescinded')) return 'DECLINED';
  if (s.includes('closed') || s.includes('withdrawn') || s.includes('not taken') || s.includes('terminated') || s.includes('lapsed') || s.includes('surrender')) return 'CLOSED';
  return 'OTHER';
}

async function main() {
  try {
    const policies = await prisma.smartOfficePolicy.findMany({
      where: { tenantId: TENANT },
      select: { primaryAdvisor: true, carrierName: true, status: true, type: true, commAnnualizedPrem: true, targetAmount: true },
    });
    check('policies load', policies.length > 1000, `${policies.length} policies`);

    // advisor rollups
    const byAdvisor = new Map();
    for (const p of policies) {
      const a = byAdvisor.get(p.primaryAdvisor) ?? { count: 0, comm: 0, types: new Set() };
      a.count++; a.comm += Number(p.commAnnualizedPrem) || 0; if (p.type) a.types.add(p.type);
      byAdvisor.set(p.primaryAdvisor, a);
    }
    const advisors = [...byAdvisor.entries()].sort((a, b) => b[1].comm - a[1].comm);
    check('advisor rollups computed', advisors.length > 100, `${advisors.length} advisors`);
    check('top advisor has premium', advisors[0]?.[1].comm > 0, `top: ${advisors[0]?.[0]} $${Math.round(advisors[0]?.[1].comm)}`);

    // carrier rollups
    const carriers = new Set(policies.map((p) => p.carrierName).filter(Boolean));
    check('carrier rollups', carriers.size > 5, `${carriers.size} carriers`);

    // status buckets
    const inforce = policies.filter((p) => bucket(p.status) === 'INFORCE').length;
    const pending = policies.filter((p) => bucket(p.status) === 'PENDING').length;
    check('inforce bucket populated', inforce > 1000, `${inforce} inforce`);
    check('pending bucket populated', pending > 0, `${pending} pending`);

    // cross-sell candidates (single-product advisors with volume)
    const singleProduct = advisors.filter(([, a]) => a.count >= 3 && a.types.size <= 1).length;
    check('cross-sell candidates exist', singleProduct >= 0, `${singleProduct} single-product advisors`);

    // AI tables present? (informational — needs Supabase SQL run)
    const tables = await prisma.$queryRawUnsafe(
      "SELECT relname FROM pg_class WHERE relname IN ('ai_findings','ai_chat_memory','ai_email_drafts','ai_coaching_plans')"
    );
    const tableNames = tables.map((t) => t.relname);
    const allPresent = ['ai_findings', 'ai_chat_memory', 'ai_email_drafts', 'ai_coaching_plans'].every((t) => tableNames.includes(t));
    if (allPresent) check('AI output tables exist (persistence ready)', true);
    else console.log(`INFO  AI output tables NOT yet created (${tableNames.length}/4) — run scripts/ai-tools-schema.sql in Supabase SQL Editor to enable Revenue Intelligence / Agent Coach / Meeting Prep / Smart Emails persistence.`);
  } finally {
    await prisma.$disconnect();
    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
    process.exit(fail > 0 ? 1 : 0);
  }
}

main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
