import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { requireAuth } from '@/lib/auth/server-auth';

export interface AgentContract {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string | null;
  agentNpn: string | null;
  contractText: string; // Raw contract text from spreadsheet
  supervisor: string | null;
  subSource: string | null;
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

        allContracts.push({
          id: `${agent.id}-${i}`,
          agentId: agent.id,
          agentName: agent.fullName,
          agentEmail: agent.email,
          agentNpn: agent.npn,
          contractText: contractText,
          supervisor: agent.supervisor,
          subSource: agent.subSource,
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
