import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { requireAuth } from '@/lib/auth/server-auth';

export interface AgentCommission {
  id: string;
  policyNumber: string | null;
  checkDate: Date | null;
  actualAmountPaid: number | null;
  receivable: number | null;
  primaryAdvisor: string | null;
  advisorName: string | null;
  subSource: string | null;
  supervisor: string | null;
  statusDate: Date | null;
  planType: string | null;
  carrierName: string | null;
  primaryInsured: string | null;
  commAnnualizedPrem: number | null;
  premiumMode: string | null;
  importDate: Date;
}

// GET /api/smartoffice/agent-commissions
// Returns all SmartOffice commissions from the new smartoffice_commissions table
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
    const advisorFilter = searchParams.get('advisor');
    const carrierFilter = searchParams.get('carrier');
    const searchTerm = searchParams.get('search');

    const result = await withTenantContext(tenantContext.tenantId, async (db) => {
      // Build where clause
      const where: any = {
        tenantId: tenantContext.tenantId,
      };

      // Apply advisor filter
      if (advisorFilter && advisorFilter !== 'ALL') {
        where.advisorName = advisorFilter;
      }

      // Apply carrier filter
      if (carrierFilter && carrierFilter !== 'ALL') {
        where.carrierName = carrierFilter;
      }

      // Apply search filter
      if (searchTerm) {
        where.OR = [
          { advisorName: { contains: searchTerm, mode: 'insensitive' } },
          { primaryAdvisor: { contains: searchTerm, mode: 'insensitive' } },
          { carrierName: { contains: searchTerm, mode: 'insensitive' } },
          { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
          { primaryInsured: { contains: searchTerm, mode: 'insensitive' } },
          { searchText: { contains: searchTerm.toLowerCase() } },
        ];
      }

      // Fetch commissions
      const commissions = await db.smartOfficeCommission.findMany({
        where,
        orderBy: [
          { checkDate: 'desc' },
          { advisorName: 'asc' },
        ],
        select: {
          id: true,
          policyNumber: true,
          checkDate: true,
          actualAmountPaid: true,
          receivable: true,
          primaryAdvisor: true,
          advisorName: true,
          subSource: true,
          supervisor: true,
          statusDate: true,
          planType: true,
          carrierName: true,
          primaryInsured: true,
          commAnnualizedPrem: true,
          premiumMode: true,
          importDate: true,
        },
      });

      // Get unique advisors and carriers for filter dropdowns
      const [uniqueAdvisors, uniqueCarriers] = await Promise.all([
        db.smartOfficeCommission.findMany({
          where: { tenantId: tenantContext.tenantId },
          distinct: ['advisorName'],
          select: { advisorName: true },
          orderBy: { advisorName: 'asc' },
        }),
        db.smartOfficeCommission.findMany({
          where: { tenantId: tenantContext.tenantId },
          distinct: ['carrierName'],
          select: { carrierName: true },
          orderBy: { carrierName: 'asc' },
        }),
      ]);

      // Calculate totals
      const totalPaid = commissions.reduce((sum, c) => sum + (c.actualAmountPaid || 0), 0);
      const totalReceivable = commissions.reduce((sum, c) => sum + (c.receivable || 0), 0);

      return {
        commissions,
        uniqueAdvisors: uniqueAdvisors.map(a => a.advisorName).filter(Boolean),
        uniqueCarriers: uniqueCarriers.map(c => c.carrierName).filter(Boolean),
        totalPaid,
        totalReceivable,
      };
    });

    return NextResponse.json({
      commissions: result.commissions,
      filters: {
        advisors: result.uniqueAdvisors,
        carriers: result.uniqueCarriers,
      },
      totals: {
        paid: result.totalPaid,
        receivable: result.totalReceivable,
      },
      totalCommissions: result.commissions.length,
      filteredCommissions: result.commissions.length,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching SmartOffice commissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}
