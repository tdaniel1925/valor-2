/**
 * One-time SSN scrub: reduce stored full SSNs to last-4 only.
 *
 * Removes the full 9-digit SSN from two places on smartoffice_agents:
 *   1. the `ssn` column            -> last 4 digits (e.g. "7271")
 *   2. rawData.Contact.TaxID       -> last 4 digits
 *
 * Last-4 is kept as a non-NPN fallback lookup identifier (agents have no NPN).
 * Idempotent: re-running on already-scrubbed rows is a no-op.
 *
 * Usage: node scripts/scrub-ssn-to-last4.mjs            (dry run — counts only)
 *        node scripts/scrub-ssn-to-last4.mjs --apply    (write changes)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

const last4 = (v) => {
  const d = String(v || '').replace(/[^0-9]/g, '');
  return d.length >= 4 ? d.slice(-4) : null;
};
const isFull = (v) => String(v || '').replace(/[^0-9]/g, '').length >= 9;

async function main() {
  const agents = await prisma.smartOfficeAgent.findMany({
    select: { id: true, ssn: true, rawData: true },
  });

  let colScrubs = 0;
  let rawScrubs = 0;
  let writes = 0;

  for (const a of agents) {
    const data = {};

    if (isFull(a.ssn)) {
      data.ssn = last4(a.ssn);
      colScrubs++;
    }

    const raw = a.rawData && typeof a.rawData === 'object' ? a.rawData : null;
    const taxId = raw?.Contact?.TaxID;
    if (raw && isFull(taxId)) {
      // shallow clone + replace only the one nested key
      const next = { ...raw, Contact: { ...raw.Contact, TaxID: last4(taxId) } };
      data.rawData = next;
      rawScrubs++;
    }

    if (Object.keys(data).length === 0) continue;
    writes++;
    if (APPLY) {
      await prisma.smartOfficeAgent.update({ where: { id: a.id }, data });
    }
  }

  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — agents=${agents.length}`);
  console.log(`  ssn column full->last4:      ${colScrubs}`);
  console.log(`  rawData.Contact.TaxID full->last4: ${rawScrubs}`);
  console.log(`  rows ${APPLY ? 'updated' : 'that would update'}: ${writes}`);

  if (APPLY) {
    // Verify nothing full remains.
    const after = await prisma.smartOfficeAgent.findMany({ select: { ssn: true, rawData: true } });
    const remaining = after.filter(
      (a) => isFull(a.ssn) || isFull(a.rawData?.Contact?.TaxID)
    ).length;
    console.log(`  full SSNs remaining after scrub: ${remaining}`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
