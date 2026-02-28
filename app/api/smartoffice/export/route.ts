import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import { stringify } from 'csv-stringify/sync';

/**
 * GET /api/smartoffice/export
 *
 * Export policies or agents to CSV format
 * Respects all filters from the UI
 */
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

    const { searchParams } = new URL(request.url);

    // Export type
    const exportType = searchParams.get('type') || 'policies'; // 'policies' or 'agents'

    // Search
    const search = searchParams.get('search') || '';

    // Filters (single value - from quick actions)
    const carrier = searchParams.get('carrier');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const advisor = searchParams.get('advisor');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Advanced filters (multi-value)
    const statusList = searchParams.get('statusList');
    const carrierList = searchParams.get('carrierList');
    const typeList = searchParams.get('typeList');
    const premiumMin = searchParams.get('premiumMin');
    const premiumMax = searchParams.get('premiumMax');

    const data = await withTenantContext(tenantContext.tenantId, async (db) => {
      if (exportType === 'agents') {
        // Export agents
        const where: any = {
          tenantId: tenantContext.tenantId,
        };

        // Search across multiple fields
        if (search) {
          where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { npn: { contains: search, mode: 'insensitive' } },
            { supervisor: { contains: search, mode: 'insensitive' } },
          ];
        }

        const agents = await db.smartOfficeAgent.findMany({
          where,
          orderBy: { fullName: 'asc' },
        });

        return agents;
      } else {
        // Export policies (default)
        const where: any = {
          tenantId: tenantContext.tenantId,
        };

        // Search across multiple fields
        if (search) {
          where.OR = [
            { policyNumber: { contains: search, mode: 'insensitive' } },
            { primaryAdvisor: { contains: search, mode: 'insensitive' } },
            { productName: { contains: search, mode: 'insensitive' } },
            { carrierName: { contains: search, mode: 'insensitive' } },
            { primaryInsured: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Apply single-value filters (from quick actions)
        if (carrier) where.carrierName = { contains: carrier, mode: 'insensitive' };
        if (type) where.type = type;
        if (status) where.status = status;
        if (advisor) where.primaryAdvisor = { contains: advisor, mode: 'insensitive' };

        // Apply multi-value filters (from advanced filter panel)
        if (statusList) {
          const statuses = statusList.split(',');
          where.status = { in: statuses as any };
        }
        if (carrierList) {
          const carriers = carrierList.split(',');
          where.carrierName = { in: carriers };
        }
        if (typeList) {
          const types = typeList.split(',');
          where.type = { in: types as any };
        }

        // Date filters
        if (dateFrom || dateTo) {
          where.statusDate = {};
          if (dateFrom) where.statusDate.gte = new Date(dateFrom);
          if (dateTo) where.statusDate.lte = new Date(dateTo);
        }

        // Premium range filters
        if (premiumMin || premiumMax) {
          where.commAnnualizedPrem = {};
          if (premiumMin) where.commAnnualizedPrem.gte = parseFloat(premiumMin);
          if (premiumMax) where.commAnnualizedPrem.lte = parseFloat(premiumMax);
        }

        const policies = await db.smartOfficePolicy.findMany({
          where,
          orderBy: { lastSyncDate: 'desc' },
        });

        return policies;
      }
    });

    // Generate CSV based on export type
    let csv: string;
    let filename: string;

    if (exportType === 'agents') {
      // Map agents to CSV-friendly format
      const csvData = data.map((agent: any) => ({
        'Full Name': agent.fullName,
        'Email': agent.email || '',
        'Phone': agent.phones ? agent.phones.split('\n')[0] : '',
        'Supervisor': agent.supervisor || '',
        'NPN': agent.npn || '',
        'Source': agent.subSource || '',
        'Contracts': agent.contractList || '',
        'Import Date': agent.importDate ? new Date(agent.importDate).toLocaleDateString() : '',
      }));

      csv = stringify(csvData, {
        header: true,
        columns: [
          'Full Name',
          'Email',
          'Phone',
          'Supervisor',
          'NPN',
          'Source',
          'Contracts',
          'Import Date',
        ],
      });

      filename = `smartoffice-agents-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Map policies to CSV-friendly format
      const csvData = data.map((policy: any) => ({
        'Policy Number': policy.policyNumber,
        'Primary Advisor': policy.primaryAdvisor,
        'Product Name': policy.productName,
        'Carrier': policy.carrierName,
        'Insured': policy.primaryInsured,
        'Status Date': policy.statusDate ? new Date(policy.statusDate).toLocaleDateString() : '',
        'Type': policy.type,
        'Status': policy.status,
        'Target Amount': policy.targetAmount || '',
        'Annual Premium': policy.commAnnualizedPrem || '',
        'Weighted Premium': policy.weightedPremium || '',
        'First Year Commission': policy.firstYearCommission || '',
        'Renewal Commission': policy.renewalCommission || '',
        'Import Date': policy.importDate ? new Date(policy.importDate).toLocaleDateString() : '',
      }));

      csv = stringify(csvData, {
        header: true,
        columns: [
          'Policy Number',
          'Primary Advisor',
          'Product Name',
          'Carrier',
          'Insured',
          'Status Date',
          'Type',
          'Status',
          'Target Amount',
          'Annual Premium',
          'Weighted Premium',
          'First Year Commission',
          'Renewal Commission',
          'Import Date',
        ],
      });

      filename = `smartoffice-policies-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}
