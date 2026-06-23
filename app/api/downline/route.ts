// =============================================
// GET /api/downline
// Returns the logged-in agent's downline + that downline's book of business,
// scoped by their email -> SmartOffice tree. Admins (ADMINISTRATOR/EXECUTIVE)
// see the ENTIRE Valor org, just like Phil.
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { getOrgForEmail } from '@/lib/downline/service';
import { prisma } from '@/lib/db/prisma';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });

    const authUser = await requireAuth(request);

    // Look up role (drives the admin "see everything" override).
    const dbUser = await prisma.user.findUnique({
      where: { id: (authUser as any).id },
      select: { role: true, email: true },
    });
    const email = dbUser?.email || (authUser as any)?.email || '';
    const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);

    if (!email && !isAdmin) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }

    const org = await getOrgForEmail(tenant.tenantId, email, { isAdmin });
    if (!org.matched) {
      return NextResponse.json({
        matched: false,
        message: 'No agent record matches your email yet. Contact your administrator.',
        downline: [], policies: [], totals: { agents: 0, policies: 0, annualPremium: 0 },
      });
    }
    return NextResponse.json(org);
  } catch (e: any) {
    if (e?.message === 'Unauthorized') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
