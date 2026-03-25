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
  carrierName: string;
  contractType: string; // Solicitor, Producer, etc.
  contractNumber: string;
  status: 'Active' | 'Pending' | 'Closed';
  rawContractText: string;
}

interface ParsedContract {
  carrierName: string;
  contractType: string;
  contractNumber: string;
  status: 'Active' | 'Pending' | 'Closed';
  rawContractText: string;
}

/**
 * Parse contract list from SmartOffice format
 * Format: [CarrierName][ContractType][ContractNumber]
 * Example: "Columbus Life Insurance CompanySolicitor77758"
 */
function parseContractList(contractListText: string | null): ParsedContract[] {
  if (!contractListText) return [];

  const contracts: ParsedContract[] = [];
  const lines = contractListText.split('\n').map(l => l.trim()).filter(l => l);

  for (const line of lines) {
    // Try to extract carrier name, contract type, and contract number
    // Pattern: Look for contract types like "Solicitor", "Producer", "Agent", etc.
    const contractTypes = [
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
      'GA'
    ];

    let foundType: string | null = null;
    let typeIndex = -1;

    // Find the contract type in the line
    for (const type of contractTypes) {
      const index = line.indexOf(type);
      if (index > -1) {
        foundType = type;
        typeIndex = index;
        break;
      }
    }

    if (foundType && typeIndex > 0) {
      const carrierName = line.substring(0, typeIndex).trim();
      const remainder = line.substring(typeIndex + foundType.length).trim();

      // Extract contract number (everything after the type)
      // Clean up status indicators like "*Pending", "Closed"
      let contractNumber = remainder;
      let status: 'Active' | 'Pending' | 'Closed' = 'Active';

      if (contractNumber.includes('*Pending') || contractNumber.toLowerCase().includes('pending')) {
        status = 'Pending';
        contractNumber = contractNumber.replace('*Pending', '').replace('Pending', '').trim();
      } else if (contractNumber.toLowerCase().includes('closed')) {
        status = 'Closed';
        contractNumber = contractNumber.replace('Closed', '').trim();
      }

      // Remove any leading special characters
      contractNumber = contractNumber.replace(/^[-*\s]+/, '');

      contracts.push({
        carrierName: carrierName || 'Unknown Carrier',
        contractType: foundType,
        contractNumber: contractNumber || 'N/A',
        status,
        rawContractText: line
      });
    } else {
      // If we can't parse it, add as-is with unknown status
      contracts.push({
        carrierName: line,
        contractType: 'Unknown',
        contractNumber: 'N/A',
        status: 'Active',
        rawContractText: line
      });
    }
  }

  return contracts;
}

// GET /api/smartoffice/agent-contracts
// Returns all agent contracts parsed from SmartOffice agent data
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
    const carrierFilter = searchParams.get('carrier');
    const statusFilter = searchParams.get('status');
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
        },
        orderBy: {
          fullName: 'asc',
        },
      });
    });

    // Parse all contracts from all agents
    const allContracts: AgentContract[] = [];

    for (const agent of agents) {
      const parsedContracts = parseContractList(agent.contractList);

      for (const contract of parsedContracts) {
        allContracts.push({
          id: `${agent.id}-${contract.carrierName}-${contract.contractNumber}`,
          agentId: agent.id,
          agentName: agent.fullName,
          agentEmail: agent.email,
          agentNpn: agent.npn,
          carrierName: contract.carrierName,
          contractType: contract.contractType,
          contractNumber: contract.contractNumber,
          status: contract.status,
          rawContractText: contract.rawContractText,
        });
      }
    }

    // Apply filters
    let filteredContracts = allContracts;

    if (agentFilter) {
      filteredContracts = filteredContracts.filter(c => c.agentName === agentFilter);
    }

    if (carrierFilter) {
      filteredContracts = filteredContracts.filter(c => c.carrierName === carrierFilter);
    }

    if (statusFilter) {
      filteredContracts = filteredContracts.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredContracts = filteredContracts.filter(c =>
        c.agentName.toLowerCase().includes(search) ||
        c.carrierName.toLowerCase().includes(search) ||
        c.contractNumber.toLowerCase().includes(search) ||
        c.contractType.toLowerCase().includes(search)
      );
    }

    // Get unique values for filters
    const uniqueAgents = Array.from(new Set(allContracts.map(c => c.agentName))).sort();
    const uniqueCarriers = Array.from(new Set(allContracts.map(c => c.carrierName))).sort();

    return NextResponse.json({
      contracts: filteredContracts,
      filters: {
        agents: uniqueAgents,
        carriers: uniqueCarriers,
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
