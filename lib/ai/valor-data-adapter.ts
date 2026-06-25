/**
 * Valor data adapter for the AI Tools.
 *
 * SmartViews' AI tools query Supabase tables directly (snake_case columns,
 * numeric status codes, agent grouping by contact_id). Valor reads SmartOffice
 * data through Prisma via lib/smartoffice/data-service.ts (camelCase, string
 * statuses, policy→agent link is the `primaryAdvisor` NAME string).
 *
 * This module is the single bridge: every AI tool gets its data from here, and
 * here only. It never touches Prisma directly — it composes the canonical
 * data-service functions so tenant scoping (withTenantContext / RLS) is always
 * applied upstream.
 *
 * Verified against live data (2026-06-23): all 283 distinct `primaryAdvisor`
 * values match a `SmartOfficeAgent.fullName`; agents have email (99%) but NO npn.
 */

import {
  getPolicies,
  getPolicyStats,
  getAgents,
  type PolicyWithMetadata,
  type AgentWithMetadata,
} from '@/lib/smartoffice/data-service';
import { findAgentsByEmail, getScopedPolicies } from '@/lib/downline/service';

// ---------------------------------------------------------------------------
// Status mapping — SmartOffice string statuses → coarse buckets the AI reasons over.

export type PolicyBucket = 'INFORCE' | 'PENDING' | 'DECLINED' | 'CLOSED' | 'OTHER';

/** Map a raw SmartOffice status string to a coarse bucket. */
export function statusBucket(status: string | null | undefined): PolicyBucket {
  const s = (status || '').toLowerCase();
  if (s.includes('inforce') || s.includes('issued') || s.includes('approved')) return 'INFORCE';
  if (
    s.includes('pending') ||
    s.includes('submitted') ||
    s.includes('await') ||
    s.includes('incomplete') ||
    s.includes('informal')
  ) {
    return 'PENDING';
  }
  if (s.includes('declined') || s.includes('postponed') || s.includes('rescinded')) return 'DECLINED';
  if (
    s.includes('closed') ||
    s.includes('withdrawn') ||
    s.includes('not taken') ||
    s.includes('terminated') ||
    s.includes('lapsed') ||
    s.includes('surrender')
  ) {
    return 'CLOSED';
  }
  return 'OTHER';
}

const num = (v: number | null | undefined): number => (typeof v === 'number' && isFinite(v) ? v : 0);

// ---------------------------------------------------------------------------
// Lightweight, AI-friendly shapes (kept small so they fit in prompt context).

export interface PolicyLite {
  id: string;
  policyNumber: string;
  advisor: string;
  carrier: string;
  product: string;
  insured: string;
  type: string;
  status: string;
  bucket: PolicyBucket;
  statusDate: string | null;
  commAnnualizedPrem: number;
  annualPremium: number;
}

export interface AdvisorRollup {
  advisor: string;
  policyCount: number;
  inforceCount: number;
  pendingCount: number;
  commissionablePremium: number;
  annualPremium: number;
  carriers: string[];
  productTypes: string[];
  lastActivity: string | null;
}

export interface CarrierRollup {
  carrier: string;
  policyCount: number;
  inforceCount: number;
  commissionablePremium: number;
  advisors: number;
}

export function toLite(p: PolicyWithMetadata): PolicyLite {
  return {
    id: p.id,
    policyNumber: p.policyNumber || '',
    advisor: p.primaryAdvisor || 'Unknown',
    carrier: p.carrierName || 'Unknown',
    product: p.productName || '',
    insured: p.primaryInsured || '',
    type: p.type || '',
    status: p.status || '',
    bucket: statusBucket(p.status),
    statusDate: p.statusDate ? new Date(p.statusDate).toISOString() : null,
    commAnnualizedPrem: num(p.commAnnualizedPrem),
    annualPremium: num(p.targetAmount),
  };
}

// ---------------------------------------------------------------------------
// Book scope — EVERY AI tool operates on the logged-in user's own + downline
// book, NOT the whole tenant (admins/executives see all). A BookScope is either
// a bare tenantId (admin/whole-tenant, back-compat) or {tenantId,email,isAdmin}.

export type BookScope = string | { tenantId: string; email: string; isAdmin: boolean };

function scopeTenant(scope: BookScope): string {
  return typeof scope === 'string' ? scope : scope.tenantId;
}

/** All policies in the scope, as AI-friendly lite rows (filtered in-memory). */
export async function fetchPolicies(
  scope: BookScope,
  filters: { advisor?: string; carrier?: string; status?: string; search?: string } = {}
): Promise<PolicyLite[]> {
  let rows: PolicyLite[];
  if (typeof scope === 'string' || scope.isAdmin) {
    // Whole tenant (admin or back-compat callers).
    const { policies } = await getPolicies(scopeTenant(scope), {});
    rows = policies.map(toLite);
  } else {
    // User-scoped: own + downline only.
    const scoped = await getScopedPolicies(scope.tenantId, scope.email, false);
    rows = scoped.map(toLite);
  }
  // Apply filters in-memory so scoping and filtering compose.
  const norm = (s: string | null | undefined) => (s || '').toLowerCase();
  if (filters.advisor) rows = rows.filter((p) => norm(p.advisor).includes(norm(filters.advisor)));
  if (filters.carrier) rows = rows.filter((p) => norm(p.carrier).includes(norm(filters.carrier)));
  if (filters.status) rows = rows.filter((p) => statusBucket(p.status) === statusBucket(filters.status) || norm(p.status).includes(norm(filters.status)));
  if (filters.search) {
    const q = norm(filters.search);
    rows = rows.filter((p) => norm(p.policyNumber).includes(q) || norm(p.insured).includes(q) || norm(p.advisor).includes(q) || norm(p.carrier).includes(q) || norm(p.product).includes(q));
  }
  return rows;
}

/** Stats over the scope (computed from the scoped policy set). */
export async function fetchStats(scope: BookScope) {
  if (typeof scope === 'string' || scope.isAdmin) {
    return getPolicyStats(scopeTenant(scope));
  }
  const policies = await fetchPolicies(scope);
  const comm = policies.reduce((s, p) => s + p.commAnnualizedPrem, 0);
  const annual = policies.reduce((s, p) => s + p.annualPremium, 0);
  return {
    total: policies.length,
    inforce: policies.filter((p) => p.bucket === 'INFORCE').length,
    pending: policies.filter((p) => p.bucket === 'PENDING').length,
    totalPremium: comm,
    annualPremium: annual,
    commissionablePremium: comm,
  };
}

export async function fetchAgents(scope: BookScope, search?: string): Promise<AgentWithMetadata[]> {
  const { agents } = await getAgents(scopeTenant(scope), { search, limit: 1000 });
  if (typeof scope === 'string' || scope.isAdmin) return agents;
  // Scope the roster to advisors present in the user's book.
  const inBook = new Set((await fetchPolicies(scope)).map((p) => p.advisor.toLowerCase()));
  return agents.filter((a) => inBook.has((a.fullName || '').toLowerCase()));
}

// ---------------------------------------------------------------------------
// Rollups — the per-advisor / per-carrier aggregates the AI tools reason over.
// Policies link to agents by the advisor NAME (verified to match fullName).

export async function advisorRollups(scope: BookScope): Promise<AdvisorRollup[]> {
  const policies = await fetchPolicies(scope);
  const byAdvisor = new Map<string, PolicyLite[]>();
  for (const p of policies) {
    const list = byAdvisor.get(p.advisor) ?? [];
    list.push(p);
    byAdvisor.set(p.advisor, list);
  }

  const rollups: AdvisorRollup[] = [];
  for (const [advisor, list] of byAdvisor) {
    const carriers = new Set<string>();
    const types = new Set<string>();
    let inforce = 0;
    let pending = 0;
    let comm = 0;
    let annual = 0;
    let last: number | null = null;
    for (const p of list) {
      carriers.add(p.carrier);
      if (p.type) types.add(p.type);
      if (p.bucket === 'INFORCE') inforce += 1;
      else if (p.bucket === 'PENDING') pending += 1;
      comm += p.commAnnualizedPrem;
      annual += p.annualPremium;
      if (p.statusDate) {
        const t = new Date(p.statusDate).getTime();
        if (last === null || t > last) last = t;
      }
    }
    rollups.push({
      advisor,
      policyCount: list.length,
      inforceCount: inforce,
      pendingCount: pending,
      commissionablePremium: Math.round(comm),
      annualPremium: Math.round(annual),
      carriers: [...carriers].sort(),
      productTypes: [...types].sort(),
      lastActivity: last ? new Date(last).toISOString() : null,
    });
  }
  return rollups.sort((a, b) => b.commissionablePremium - a.commissionablePremium);
}

export async function carrierRollups(scope: BookScope): Promise<CarrierRollup[]> {
  const policies = await fetchPolicies(scope);
  const byCarrier = new Map<string, { count: number; inforce: number; comm: number; advisors: Set<string> }>();
  for (const p of policies) {
    const c = byCarrier.get(p.carrier) ?? { count: 0, inforce: 0, comm: 0, advisors: new Set<string>() };
    c.count += 1;
    if (p.bucket === 'INFORCE') c.inforce += 1;
    c.comm += p.commAnnualizedPrem;
    c.advisors.add(p.advisor);
    byCarrier.set(p.carrier, c);
  }
  return [...byCarrier.entries()]
    .map(([carrier, c]) => ({
      carrier,
      policyCount: c.count,
      inforceCount: c.inforce,
      commissionablePremium: Math.round(c.comm),
      advisors: c.advisors.size,
    }))
    .sort((a, b) => b.commissionablePremium - a.commissionablePremium);
}

/**
 * Resolve the logged-in user's own advisor identity from their email.
 * Returns the advisor name(s) the user writes policies under (usually one;
 * agency principals may have a person + entity row sharing the email).
 * Empty when the user has no matching SmartOffice agent record.
 */
export async function resolveSelfAdvisor(
  tenantId: string,
  email: string
): Promise<{ names: string[]; primaryName: string | null }> {
  if (!email) return { names: [], primaryName: null };
  const agents = await findAgentsByEmail(tenantId, email);
  const names = [...new Set(agents.map((a) => (a.fullName || '').trim()).filter(Boolean))];
  return { names, primaryName: names[0] ?? null };
}

/** Single advisor's full picture (for Agent Coach / Meeting Prep). */
export async function advisorDetail(scope: BookScope, advisor: string) {
  const policies = await fetchPolicies(scope, { advisor });
  const exact = policies.filter((p) => p.advisor.toLowerCase() === advisor.toLowerCase());
  const list = exact.length > 0 ? exact : policies;
  const agents = await fetchAgents(scope, advisor);
  const agent =
    agents.find((a) => (a.fullName || '').toLowerCase() === advisor.toLowerCase()) ?? agents[0] ?? null;
  return { agent, policies: list };
}
