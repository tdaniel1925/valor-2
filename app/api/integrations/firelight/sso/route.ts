import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { prisma } from '@/lib/db/prisma';
import { findAgentsByEmail } from '@/lib/downline/service';
import { fireLightSAML } from '@/lib/integrations/firelight/saml';

/**
 * GET /api/integrations/firelight/sso
 *
 * Builds a signed SAMLResponse for the logged-in agent and returns it (+ the
 * FireLight endpoint) for the client to auto-POST. The agent is resolved from
 * the SmartOffice book by email; CompanyProducerID = their apexContactId.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });

    const authUser = await requireAuth(request);

    if (!fireLightSAML.isConfigured()) {
      return NextResponse.json(
        { error: 'FireLight SSO is not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true },
    });
    const email = dbUser?.email || authUser.email || '';
    if (!email) return NextResponse.json({ error: 'No email on account' }, { status: 400 });

    // Resolve the agent's SmartOffice record (person row preferred over an
    // agency-entity row that shares the same email).
    const agents = await findAgentsByEmail(tenant.tenantId, email);
    const agent =
      agents.find((a) => (a.additionalData?.apexContactId as string | undefined)?.startsWith('Contact.')) ??
      agents[0];

    if (!agent) {
      return NextResponse.json(
        { error: 'No FireLight agent record is linked to your account.' },
        { status: 404 }
      );
    }

    // CompanyProducerID — single mapping point (apexContactId). Swap here if
    // Hexure requires a different format (e.g. numeric only).
    const companyProducerId = (agent.additionalData?.apexContactId as string | undefined) || agent.id;

    const result = fireLightSAML.generateSAMLResponse({
      nameId: dbUser?.id || authUser.id,
      fullName: agent.fullName || email,
      email,
      companyProducerId,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[FIRELIGHT_SSO] error:', error);
    const message = error instanceof Error ? error.message : 'Failed to build FireLight SSO';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
