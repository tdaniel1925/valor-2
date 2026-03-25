import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { requireAuth } from '@/lib/auth/server-auth';

// Known contract type keywords
const CONTRACT_TYPES = [
  'Solicitor',
  'Producer',
  'Agent',
  'Broker',
  'General Agent',
  'Regional General Agent',
  'PLRAGT',
  'Level',
  'Schedule',
  'SBLD',
  'PL00',
  'GA',
  'GAH',
  'BGA',
];

/**
 * Parse contract text using multiple methods
 */
function parseContractText(text: string): {
  carrierName: string | null;
  contractType: string | null;
  contractNumber: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseMethod: string;
} {
  // Method 1: Try to find contract type keyword
  for (const type of CONTRACT_TYPES) {
    const index = text.indexOf(type);
    if (index > -1) {
      const carrierName = text.substring(0, index).trim();
      const remainder = text.substring(index + type.length).trim();
      const contractNumber = remainder
        .replace('*Pending', '')
        .replace('Closed', '')
        .replace(/^\*+/, '')
        .trim();

      return {
        carrierName: carrierName || null,
        contractType: type,
        contractNumber: contractNumber || null,
        confidence: carrierName.length > 0 && contractNumber.length > 0 ? 'HIGH' : 'MEDIUM',
        parseMethod: 'KEYWORD_MATCH',
      };
    }
  }

  // Method 2: Try to find uppercase acronyms
  const acronymMatch = text.match(/([A-Z]{2,})/);
  if (acronymMatch) {
    const acronym = acronymMatch[0];
    const acronymIndex = text.indexOf(acronym);

    return {
      carrierName: text.substring(0, acronymIndex).trim() || null,
      contractType: acronym,
      contractNumber: text.substring(acronymIndex + acronym.length).trim() || null,
      confidence: 'MEDIUM',
      parseMethod: 'ACRONYM_MATCH',
    };
  }

  // Method 3: Try to split on parentheses
  const parenMatch = text.match(/^(.+?)\((.+?)\)(.+)$/);
  if (parenMatch) {
    return {
      carrierName: parenMatch[1].trim() || null,
      contractType: parenMatch[2],
      contractNumber: parenMatch[3].trim() || null,
      confidence: 'MEDIUM',
      parseMethod: 'PARENTHESES_SPLIT',
    };
  }

  // Method 4: Fallback - assume last 10 chars are contract number
  if (text.length > 15) {
    return {
      carrierName: text.slice(0, -10).trim() || null,
      contractType: 'UNKNOWN',
      contractNumber: text.slice(-10).trim() || null,
      confidence: 'LOW',
      parseMethod: 'LAST_10_CHARS',
    };
  }

  return {
    carrierName: null,
    contractType: null,
    contractNumber: null,
    confidence: 'LOW',
    parseMethod: 'FAILED',
  };
}

export interface AgentContract {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string | null;
  agentNpn: string | null;
  contractText: string; // Raw contract text from spreadsheet
  supervisor: string | null;
  subSource: string | null;
  // Parsed fields
  carrierName: string | null;
  contractType: string | null;
  contractNumber: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseMethod: string;
}

// GET /api/smartoffice/agent-contracts
// Returns all agent contracts as raw text from SmartOffice agent data
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    await requireAuth(request);

    // Get search params
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get('agent');
    const searchTerm = searchParams.get('search');

    const agents = await withTenantContext(tenantContext.tenantId, async (db) => {
      return await db.smartOfficeAgent.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          contractList: {
            not: null,
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          npn: true,
          contractList: true,
          supervisor: true,
          subSource: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      });
    });

    // Parse all contracts from all agents - one row per contract line
    const allContracts: AgentContract[] = [];

    for (const agent of agents) {
      if (!agent.contractList) continue;

      // Split by newline - each line is a separate contract
      const contractLines = agent.contractList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      for (let i = 0; i < contractLines.length; i++) {
        const contractText = contractLines[i];
        const parsed = parseContractText(contractText);

        allContracts.push({
          id: `${agent.id}-${i}`,
          agentId: agent.id,
          agentName: agent.fullName,
          agentEmail: agent.email,
          agentNpn: agent.npn,
          contractText: contractText,
          supervisor: agent.supervisor,
          subSource: agent.subSource,
          carrierName: parsed.carrierName,
          contractType: parsed.contractType,
          contractNumber: parsed.contractNumber,
          confidence: parsed.confidence,
          parseMethod: parsed.parseMethod,
        });
      }
    }

    // Apply filters
    let filteredContracts = allContracts;

    if (agentFilter) {
      filteredContracts = filteredContracts.filter(c => c.agentName === agentFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredContracts = filteredContracts.filter(c =>
        c.agentName.toLowerCase().includes(search) ||
        c.contractText.toLowerCase().includes(search) ||
        (c.agentEmail && c.agentEmail.toLowerCase().includes(search)) ||
        (c.agentNpn && c.agentNpn.toLowerCase().includes(search))
      );
    }

    // Get unique values for filters
    const uniqueAgents = Array.from(new Set(allContracts.map(c => c.agentName))).sort();

    return NextResponse.json({
      contracts: filteredContracts,
      filters: {
        agents: uniqueAgents,
      },
      totalContracts: allContracts.length,
      filteredContracts: filteredContracts.length,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching agent contracts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent contracts' },
      { status: 500 }
    );
  }
}
