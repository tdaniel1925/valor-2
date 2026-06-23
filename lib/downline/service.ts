// =============================================
// Downline service — resolves a logged-in user (by email) to their SmartOffice
// agent record(s), then walks the Valor hierarchy DOWN to return their whole org.
//
// Hierarchy = SmartOffice supervisor chain on each agent's
// additionalData.supervisorId (Apex contact_id) -> additionalData.apexContactId.
// We match USER -> agent by EMAIL (feed has email for 99% of agents).
//
// KEY: an agency entity and its principal person SHARE an email
// (e.g. danny.oliver@ofgplanners.com = "Danny Oliver" AND "Oliver Financial Group, LLC").
// So matching by email returns BOTH, and we root the downline at all of them, which
// makes a principal see their whole agency branch. For the top owner (Phil), whose
// agency entity is the org root above the agent rows, we also root at that agency.
// =============================================

import { prisma } from '@/lib/db/prisma';

export interface DownlineAgent {
  id: string;
  contactId: string | null;
  name: string;
  email: string | null;
  status: string | null;
  supervisorName: string | null;
  level: number; // 0 = a root (the user / their agency)
}

interface AgentLite {
  id: string;
  email: string | null;
  fullName: string | null;
  supervisor: string | null;
  additionalData: any;
}

const cid = (a: AgentLite): string | null => a.additionalData?.apexContactId ?? null;
const supId = (a: AgentLite): string | null => a.additionalData?.supervisorId ?? null;

export async function findAgentsByEmail(tenantId: string, email: string): Promise<AgentLite[]> {
  if (!email) return [];
  return prisma.smartOfficeAgent.findMany({
    where: { tenantId, email: email.toLowerCase() },
    select: { id: true, email: true, fullName: true, supervisor: true, additionalData: true },
  });
}

/**
 * Determine the set of root contactIds to start the downline from, given the
 * user's matched agent rows. Includes:
 *   - each matched row's own contactId, AND
 *   - each matched row's supervisor IF that supervisor is the org root (i.e. the
 *     supervisor id is not itself an agent row — meaning the person is a principal
 *     directly under the agency root, like Phil under "Valor Financial Specialists").
 */
// Agency entities and their principal share an email; an entity's fullName looks
// like a company. A person who has a same-email entity row is that agency's principal
// and should see the agency's whole branch. The TOP owner(s) are mapped explicitly to
// the org root (their agency entity is the root above all agent rows).
const COMPANY = /\b(LLC|L\.L\.C|Inc|Incorporated|Group|Services|Financial|Insurance|Agency|Holdings|Brokers|Partners|Associates|Company|Corp)\b/i;
const PERSON_NAME = /^[A-Z][A-Za-z'’.-]+ +[A-Z][A-Za-z'’.-]+/; // 'First Last...'
function isEntity(a: AgentLite): boolean {
  const n = (a.fullName || '').trim();
  return COMPANY.test(n) && !PERSON_NAME.test(n);
}

// Designated org owners -> the agency root contactId they own (their entity is the
// org root, not an agent row). Phil Resch owns Valor Financial Specialists.
const ORG_OWNERS: Record<string, string> = {
  'phil@valorfs.com': 'Contact.450.23467897', // Valor Financial Specialists, LLC (root)
};

function resolveRoots(matched: AgentLite[], byEmail: Map<string, AgentLite[]>): string[] {
  const roots = new Set<string>();
  for (const a of matched) {
    const myCid = cid(a);
    if (myCid) roots.add(myCid); // always: your own node
    // If you ARE an agency entity (same email lists an entity), root at the entity
    // so you see the whole branch under it.
    // (matched already includes both person + entity rows for the email.)
    if (isEntity(a) && myCid) roots.add(myCid);
    // Explicit org owner -> the org root above all agents.
    const owns = a.email ? ORG_OWNERS[a.email] : undefined;
    if (owns) roots.add(owns);
  }
  return [...roots];
}

export async function getDownline(
  all: AgentLite[],
  rootContactIds: string[],
): Promise<DownlineAgent[]> {
  const childrenBySup = new Map<string, AgentLite[]>();
  const byContact = new Map<string, AgentLite>();
  for (const a of all) {
    const sup = supId(a);
    if (sup) {
      if (!childrenBySup.has(sup)) childrenBySup.set(sup, []);
      childrenBySup.get(sup)!.push(a);
    }
    const c = cid(a);
    if (c) byContact.set(c, a);
  }

  const out: DownlineAgent[] = [];
  const seen = new Set<string>();
  let frontier: Array<{ cid: string; level: number }> = [];

  for (const rc of rootContactIds) {
    if (!rc || seen.has(rc)) continue;
    seen.add(rc);
    const self = byContact.get(rc);
    if (self) out.push(toDownline(self, 0)); // a real agent root
    frontier.push({ cid: rc, level: 0 });     // even if root is the agency entity (no agent row), its children expand
  }

  while (frontier.length) {
    const next: Array<{ cid: string; level: number }> = [];
    for (const node of frontier) {
      for (const child of childrenBySup.get(node.cid) || []) {
        const ccid = cid(child);
        if (!ccid || seen.has(ccid)) continue;
        seen.add(ccid);
        out.push(toDownline(child, node.level + 1));
        next.push({ cid: ccid, level: node.level + 1 });
      }
    }
    frontier = next;
  }
  return out;
}

function toDownline(a: AgentLite, level: number): DownlineAgent {
  return {
    id: a.id,
    contactId: cid(a),
    name: a.fullName || '—',
    email: a.email,
    status: a.additionalData?.status ?? null,
    supervisorName: a.supervisor ?? null,
    level,
  };
}

export async function getDownlinePolicies(tenantId: string, contactIds: string[]) {
  if (!contactIds.length) return [];
  const policies = await prisma.smartOfficePolicy.findMany({
    where: { tenantId },
    select: {
      id: true, policyNumber: true, primaryAdvisor: true, productName: true,
      carrierName: true, primaryInsured: true, status: true, type: true,
      targetAmount: true, commAnnualizedPrem: true, additionalData: true, statusDate: true,
    },
  });
  const idSet = new Set(contactIds);
  return policies.filter((p: any) => idSet.has(p.additionalData?.apexAdvisorContactId));
}

/** Full org view for a logged-in user's email. */
export async function getOrgForEmail(tenantId: string, email: string, opts: { isAdmin?: boolean } = {}) {
  const all = await prisma.smartOfficeAgent.findMany({
    where: { tenantId },
    select: { id: true, email: true, fullName: true, supervisor: true, additionalData: true },
  });
  const byContact = new Map<string, AgentLite>();
  for (const a of all) { const c = cid(a); if (c) byContact.set(c, a); }

  // Admins / executives see the ENTIRE tenant org, just like the owner — no email match needed.
  if (opts.isAdmin) {
    const downlineAll: DownlineAgent[] = all.map((a) => toDownline(a, 0));
    const cidsAll = downlineAll.map((d) => d.contactId).filter(Boolean) as string[];
    const policiesAll = await getDownlinePolicies(tenantId, cidsAll);
    const premAll = policiesAll.reduce((s: number, p: any) => s + (Number(p.targetAmount) || 0), 0);
    const commAll = policiesAll.reduce((s: number, p: any) => s + (Number(p.commAnnualizedPrem) || 0), 0);
    return {
      matched: true as const,
      isAdmin: true,
      rootName: 'All Agents (Admin)',
      downline: downlineAll,
      policies: policiesAll,
      totals: { agents: downlineAll.length, policies: policiesAll.length, annualPremium: premAll, commissionablePremium: commAll },
    };
  }

  const matched = all.filter((a) => a.email && a.email === email.toLowerCase());
  if (!matched.length) return { matched: false as const, downline: [], policies: [], totals: null };

  const roots = resolveRoots(matched, new Map());
  const downline = await getDownline(all, roots);
  const cids = downline.map((d) => d.contactId).filter(Boolean) as string[];
  const policies = await getDownlinePolicies(tenantId, cids);
  const totalPremium = policies.reduce((s: number, p: any) => s + (Number(p.targetAmount) || 0), 0);
  const commPremium = policies.reduce((s: number, p: any) => s + (Number(p.commAnnualizedPrem) || 0), 0);
  return {
    matched: true as const,
    rootName: matched.find((a) => a.fullName)?.fullName ?? email,
    downline,
    policies,
    totals: { agents: downline.length, policies: policies.length, annualPremium: totalPremium, commissionablePremium: commPremium },
  };
}
