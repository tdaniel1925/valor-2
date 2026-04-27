import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { requireAuth } from '@/lib/auth/server-auth';

export interface AgentContract {
  id: string;
  advisorName: string;
  advisorEmail: string | null;
  advisorPhone: string | null;
  carrierName: string | null;
  contractType: string | null;
  contractNumber: string | null;
  commissionLevel: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  subSource: string | null;
  supervisor: string | null;
  importDate: Date;
}

// GET /api/smartoffice/agent-contracts
// Returns all SmartOffice contracts from the new smartoffice_contracts table
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

    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Build where clause
      const where: any = {
        tenantId: tenantContext.tenantId,
      };

      // Apply agent filter
      if (agentFilter && agentFilter !== 'ALL') {
        where.advisorName = agentFilter;
      }

      // Apply search filter
      if (searchTerm) {
        where.OR = [
          { advisorName: { contains: searchTerm, mode: 'insensitive' } },
          { advisorEmail: { contains: searchTerm, mode: 'insensitive' } },
          { carrierName: { contains: searchTerm, mode: 'insensitive' } },
          { contractNumber: { contains: searchTerm, mode: 'insensitive' } },
          { searchText: { contains: searchTerm.toLowerCase() } },
        ];
      }

      // Fetch contracts
      const contracts = await db.smartOfficeContract.findMany({
        where,
        orderBy: [
          { advisorName: 'asc' },
          { carrierName: 'asc' },
        ],
        select: {
          id: true,
          advisorName: true,
          advisorEmail: true,
          advisorPhone: true,
          carrierName: true,
          contractType: true,
          contractNumber: true,
          commissionLevel: true,
          effectiveDate: true,
          expirationDate: true,
          subSource: true,
          supervisor: true,
          importDate: true,
        },
      });

      // Get unique advisor names for filter dropdown
      const uniqueAdvisors = await db.smartOfficeContract.findMany({
        where: { tenantId: tenantContext.tenantId },
        distinct: ['advisorName'],
        select: { advisorName: true },
        orderBy: { advisorName: 'asc' },
      });

      return {
        contracts,
        uniqueAdvisors: uniqueAdvisors.map(a => a.advisorName),
      };
    });

    return NextResponse.json({
      contracts: result.contracts,
      filters: {
        agents: result.uniqueAdvisors,
      },
      totalContracts: result.contracts.length,
      filteredContracts: result.contracts.length,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching SmartOffice contracts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}
