/**
 * Safe tool executor for the Valor AI chat.
 *
 * Replaces the prior eval()-on-model-output approach in
 * app/api/smartoffice/chat/route.ts. Each Claude tool call is dispatched to a
 * typed handler here; the tenantId is supplied by the server (never by the model),
 * and all data comes through lib/ai/valor-data-adapter.ts.
 */

import {
  fetchPolicies,
  fetchStats,
  advisorRollups,
  carrierRollups,
  advisorDetail,
  type PolicyLite,
} from '@/lib/ai/valor-data-adapter';

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function clampLimit(v: unknown, def: number, max: number): number {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), max);
}

function summarizePolicy(p: PolicyLite): string {
  const parts = [p.policyNumber || 'No #', p.carrier || 'Unknown carrier'];
  if (p.insured) parts.push(p.insured);
  parts.push(`[${p.status || p.bucket}]`);
  if (p.commAnnualizedPrem > 0) parts.push(money(p.commAnnualizedPrem));
  return parts.join(', ');
}

/**
 * Execute a tool call and return a plain-text result for Claude to read back.
 * `tenantId` is server-trusted. Unknown tools / errors return an "Error: ..." string
 * (never throws into the message loop).
 */
export async function executeValorTool(
  toolName: string,
  input: Record<string, unknown>,
  tenantId: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'search_policies': {
        const limit = clampLimit(input.limit, 25, 100);
        const policies = await fetchPolicies(tenantId, {
          advisor: typeof input.advisor === 'string' ? input.advisor : undefined,
          carrier: typeof input.carrier === 'string' ? input.carrier : undefined,
          status: typeof input.status === 'string' ? input.status : undefined,
          search: typeof input.search === 'string' ? input.search : undefined,
        });
        if (policies.length === 0) return 'No policies found matching that search.';
        const totalPrem = policies.reduce((s, p) => s + p.commAnnualizedPrem, 0);
        const shown = policies.slice(0, limit);
        let out = `Found ${policies.length} polic${policies.length === 1 ? 'y' : 'ies'} (total commissionable premium ${money(totalPrem)}):\n`;
        out += shown.map((p, i) => `${i + 1}. ${summarizePolicy(p)}`).join('\n');
        if (policies.length > shown.length) out += `\n…and ${policies.length - shown.length} more.`;
        return out;
      }

      case 'get_summary_stats': {
        const s = await fetchStats(tenantId);
        return [
          `Total policies: ${s.total.toLocaleString()}`,
          `Inforce: ${s.inforce.toLocaleString()}`,
          `Pending: ${s.pending.toLocaleString()}`,
          `Annual premium: ${money(s.annualPremium)}`,
          `Commissionable premium: ${money(s.commissionablePremium)}`,
        ].join('\n');
      }

      case 'get_top_producers': {
        const limit = clampLimit(input.limit, 10, 50);
        const rollups = (await advisorRollups(tenantId)).slice(0, limit);
        if (rollups.length === 0) return 'No advisor production found.';
        return rollups
          .map(
            (r, i) =>
              `${i + 1}. ${r.advisor} — ${money(r.commissionablePremium)} commissionable, ${r.policyCount} policies (${r.inforceCount} inforce), ${r.carriers.length} carriers`
          )
          .join('\n');
      }

      case 'get_advisor_production': {
        const advisor = typeof input.advisor === 'string' ? input.advisor : '';
        if (!advisor) return 'Error: advisor name is required.';
        const { agent, policies } = await advisorDetail(tenantId, advisor);
        if (policies.length === 0) return `No policies found for advisor "${advisor}".`;
        const comm = policies.reduce((s, p) => s + p.commAnnualizedPrem, 0);
        const annual = policies.reduce((s, p) => s + p.annualPremium, 0);
        const inforce = policies.filter((p) => p.bucket === 'INFORCE').length;
        const pending = policies.filter((p) => p.bucket === 'PENDING').length;
        const carriers = [...new Set(policies.map((p) => p.carrier))];
        const types = [...new Set(policies.map((p) => p.type).filter(Boolean))];
        return [
          `Advisor: ${agent?.fullName || advisor}${agent?.email ? ` (${agent.email})` : ''}`,
          `Policies: ${policies.length} (${inforce} inforce, ${pending} pending)`,
          `Commissionable premium: ${money(comm)}`,
          `Annual premium: ${money(annual)}`,
          `Carriers (${carriers.length}): ${carriers.slice(0, 8).join(', ')}`,
          `Product types: ${types.join(', ') || 'n/a'}`,
        ].join('\n');
      }

      case 'get_carrier_breakdown': {
        const limit = clampLimit(input.limit, 15, 50);
        const rollups = (await carrierRollups(tenantId)).slice(0, limit);
        if (rollups.length === 0) return 'No carrier data found.';
        return rollups
          .map(
            (r, i) =>
              `${i + 1}. ${r.carrier} — ${money(r.commissionablePremium)}, ${r.policyCount} policies (${r.inforceCount} inforce), ${r.advisors} advisors`
          )
          .join('\n');
      }

      default:
        return `Error: unknown tool "${toolName}".`;
    }
  } catch (err) {
    console.error('[AI] tool execution error:', toolName, err);
    return `Error running ${toolName}: ${err instanceof Error ? err.message : 'unknown error'}`;
  }
}
