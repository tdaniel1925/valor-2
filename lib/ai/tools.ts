/**
 * Claude tool definitions for the Valor AI chat/search.
 *
 * Pruned to what Valor's data actually supports (no contracts/requirements/agent
 * scores). Each tool maps to a handler in tool-executor.ts that pulls real data
 * through lib/ai/valor-data-adapter.ts — Claude never runs queries directly.
 */

import type Anthropic from '@anthropic-ai/sdk';

export const valorTools: Anthropic.Tool[] = [
  {
    name: 'search_policies',
    description:
      'Search the agency book of policies by writing advisor, carrier, status bucket, or free text (policy number, insured, product). Returns matching policies with premium.',
    input_schema: {
      type: 'object' as const,
      properties: {
        advisor: { type: 'string', description: 'Filter by writing agent name (partial match)' },
        carrier: { type: 'string', description: 'Filter by carrier name (partial match)' },
        status: {
          type: 'string',
          description: 'Status bucket or string: inforce, pending, declined, closed (or a raw status)',
        },
        search: { type: 'string', description: 'Free text across policy number, insured name, product' },
        limit: { type: 'number', description: 'Max rows to return (default 25, max 100)' },
      },
    },
  },
  {
    name: 'get_summary_stats',
    description:
      'Get tenant-wide totals: total policies, inforce count, pending count, total annual premium, and total commissionable premium. Use for "how many" / "how much" questions.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_top_producers',
    description:
      'Get the top writing advisors ranked by commissionable premium, with policy counts and product mix.',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'How many advisors (default 10, max 50)' } },
    },
  },
  {
    name: 'get_advisor_production',
    description:
      "Get one advisor's book: policy count, inforce/pending counts, commissionable + annual premium, carriers, and product types.",
    input_schema: {
      type: 'object' as const,
      properties: { advisor: { type: 'string', description: 'Advisor full name' } },
      required: ['advisor'],
    },
  },
  {
    name: 'get_carrier_breakdown',
    description:
      'Get premium and policy counts grouped by carrier, ranked by commissionable premium. Use for carrier-concentration questions.',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'How many carriers (default 15)' } },
    },
  },
];
